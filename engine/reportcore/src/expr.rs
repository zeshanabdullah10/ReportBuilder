//! A small, safe expression language used for data bindings.
//!
//! ```text
//! serial                          path lookup (a leading `data.` is optional)
//! dut.channels[0].name            member and index access
//! value >= low && value <= high   comparison and logic (also `and`, `or`, `not`)
//! status == "PASS" ? "OK" : "NG"  ternary
//! operator ?? "unknown"           null coalescing
//! vbus | fixed(3)                 pipes: `x | f(a)` is `f(x, a)`
//! count_if(measurements, "status", "FAIL")
//! ```
//!
//! Evaluation never panics and never executes arbitrary code. Missing paths
//! evaluate to `null` and are recorded so the editor and CLI can report them.

use serde_json::{Map, Number, Value};
use std::cell::RefCell;
use std::collections::BTreeSet;
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub struct ExprError {
    pub message: String,
    pub offset: usize,
}

impl fmt::Display for ExprError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} (at column {})", self.message, self.offset + 1)
    }
}

impl std::error::Error for ExprError {}

fn err<T>(message: impl Into<String>, offset: usize) -> Result<T, ExprError> {
    Err(ExprError { message: message.into(), offset })
}

// ---------------------------------------------------------------------------
// Lexer
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq)]
enum Tok {
    Num(f64),
    Str(String),
    Ident(String),
    Op(&'static str),
    End,
}

fn lex(src: &str) -> Result<Vec<(Tok, usize)>, ExprError> {
    let chars: Vec<char> = src.chars().collect();
    let mut out = Vec::new();
    let mut i = 0;
    const OPS: [&str; 26] = [
        "===", "!==", "==", "!=", "<=", ">=", "&&", "||", "??", "<", ">", "+", "-", "*", "/", "%", "!", "?", ":", ".",
        ",", "(", ")", "[", "]", "|",
    ];
    while i < chars.len() {
        let c = chars[i];
        if c.is_whitespace() {
            i += 1;
            continue;
        }
        let start = i;
        // After `.` (member access) a number is an index: `list.0`, never `list .0`.
        let after_dot = matches!(out.last(), Some((Tok::Op("."), _)));
        if c.is_ascii_digit()
            || (c == '.'
                && !after_dot
                && chars.get(i + 1).is_some_and(|d| d.is_ascii_digit())
                && !matches!(out.last(), Some((Tok::Ident(_), _)) | Some((Tok::Op(")"), _)) | Some((Tok::Op("]"), _))))
        {
            if after_dot {
                while i < chars.len() && chars[i].is_ascii_digit() {
                    i += 1;
                }
                let text: String = chars[start..i].iter().collect();
                out.push((Tok::Num(text.parse().unwrap_or(0.0)), start));
                continue;
            }
            while i < chars.len() && (chars[i].is_ascii_digit() || chars[i] == '.') {
                i += 1;
            }
            if i < chars.len() && (chars[i] == 'e' || chars[i] == 'E') {
                let mut j = i + 1;
                if j < chars.len() && (chars[j] == '+' || chars[j] == '-') {
                    j += 1;
                }
                if j < chars.len() && chars[j].is_ascii_digit() {
                    i = j;
                    while i < chars.len() && chars[i].is_ascii_digit() {
                        i += 1;
                    }
                }
            }
            let text: String = chars[start..i].iter().collect();
            match text.parse::<f64>() {
                Ok(n) => out.push((Tok::Num(n), start)),
                Err(_) => return err(format!("invalid number '{text}'"), start),
            }
            continue;
        }
        if c == '"' || c == '\'' {
            let quote = c;
            i += 1;
            let mut s = String::new();
            loop {
                match chars.get(i) {
                    None => return err("unterminated string", start),
                    Some(&ch) if ch == quote => {
                        i += 1;
                        break;
                    }
                    Some('\\') => {
                        let esc = chars.get(i + 1).copied();
                        match esc {
                            Some('n') => s.push('\n'),
                            Some('t') => s.push('\t'),
                            Some(other) => s.push(other),
                            None => return err("unterminated string", start),
                        }
                        i += 2;
                    }
                    Some(&ch) => {
                        s.push(ch);
                        i += 1;
                    }
                }
            }
            out.push((Tok::Str(s), start));
            continue;
        }
        if c.is_alphabetic() || c == '_' || c == '$' {
            while i < chars.len() && (chars[i].is_alphanumeric() || chars[i] == '_' || chars[i] == '$') {
                i += 1;
            }
            out.push((Tok::Ident(chars[start..i].iter().collect()), start));
            continue;
        }
        let rest: String = chars[i..chars.len().min(i + 3)].iter().collect();
        let mut matched = false;
        for op in OPS {
            if rest.starts_with(op) {
                // Normalise JavaScript-style strict operators.
                let norm = match op {
                    "===" => "==",
                    "!==" => "!=",
                    other => other,
                };
                out.push((Tok::Op(norm), start));
                i += op.chars().count();
                matched = true;
                break;
            }
        }
        if !matched {
            return err(format!("unexpected character '{c}'"), start);
        }
    }
    out.push((Tok::End, chars.len()));
    Ok(out)
}

// ---------------------------------------------------------------------------
// AST + parser
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq)]
pub enum Expr {
    Lit(Value),
    Var(String),
    Member(Box<Expr>, String),
    Index(Box<Expr>, Box<Expr>),
    Call(String, Vec<Expr>),
    Unary(&'static str, Box<Expr>),
    Binary(&'static str, Box<Expr>, Box<Expr>),
    Ternary(Box<Expr>, Box<Expr>, Box<Expr>),
    List(Vec<Expr>),
}

struct Parser {
    toks: Vec<(Tok, usize)>,
    pos: usize,
}

impl Parser {
    fn peek(&self) -> &Tok {
        &self.toks[self.pos].0
    }
    fn offset(&self) -> usize {
        self.toks[self.pos].1
    }
    fn bump(&mut self) -> Tok {
        let t = self.toks[self.pos].0.clone();
        if self.pos < self.toks.len() - 1 {
            self.pos += 1;
        }
        t
    }
    fn eat_op(&mut self, op: &str) -> bool {
        if matches!(self.peek(), Tok::Op(o) if *o == op) {
            self.bump();
            true
        } else {
            false
        }
    }
    fn eat_word(&mut self, w: &str) -> bool {
        if matches!(self.peek(), Tok::Ident(o) if o == w) {
            self.bump();
            true
        } else {
            false
        }
    }
    fn expect_op(&mut self, op: &str) -> Result<(), ExprError> {
        if self.eat_op(op) {
            Ok(())
        } else {
            err(format!("expected '{op}'"), self.offset())
        }
    }

    fn expr(&mut self) -> Result<Expr, ExprError> {
        self.pipe()
    }

    fn pipe(&mut self) -> Result<Expr, ExprError> {
        let mut lhs = self.ternary()?;
        while self.eat_op("|") {
            let at = self.offset();
            let name = match self.bump() {
                Tok::Ident(n) => n,
                _ => return err("expected a function name after '|'", at),
            };
            let mut args = vec![lhs];
            if self.eat_op("(") {
                args.extend(self.args(")")?);
            }
            lhs = Expr::Call(name, args);
        }
        Ok(lhs)
    }

    fn ternary(&mut self) -> Result<Expr, ExprError> {
        let cond = self.coalesce()?;
        if self.eat_op("?") {
            let a = self.ternary()?;
            self.expect_op(":")?;
            let b = self.ternary()?;
            return Ok(Expr::Ternary(Box::new(cond), Box::new(a), Box::new(b)));
        }
        Ok(cond)
    }

    fn coalesce(&mut self) -> Result<Expr, ExprError> {
        let mut lhs = self.or()?;
        while self.eat_op("??") {
            let rhs = self.or()?;
            lhs = Expr::Binary("??", Box::new(lhs), Box::new(rhs));
        }
        Ok(lhs)
    }

    fn or(&mut self) -> Result<Expr, ExprError> {
        let mut lhs = self.and()?;
        while self.eat_op("||") || self.eat_word("or") {
            let rhs = self.and()?;
            lhs = Expr::Binary("||", Box::new(lhs), Box::new(rhs));
        }
        Ok(lhs)
    }

    fn and(&mut self) -> Result<Expr, ExprError> {
        let mut lhs = self.equality()?;
        while self.eat_op("&&") || self.eat_word("and") {
            let rhs = self.equality()?;
            lhs = Expr::Binary("&&", Box::new(lhs), Box::new(rhs));
        }
        Ok(lhs)
    }

    fn binary_level(
        &mut self,
        ops: &[&'static str],
        next: fn(&mut Self) -> Result<Expr, ExprError>,
    ) -> Result<Expr, ExprError> {
        let mut lhs = next(self)?;
        'outer: loop {
            for &op in ops {
                if self.eat_op(op) {
                    let rhs = next(self)?;
                    lhs = Expr::Binary(op, Box::new(lhs), Box::new(rhs));
                    continue 'outer;
                }
            }
            return Ok(lhs);
        }
    }

    fn equality(&mut self) -> Result<Expr, ExprError> {
        self.binary_level(&["==", "!="], Self::comparison)
    }
    fn comparison(&mut self) -> Result<Expr, ExprError> {
        self.binary_level(&["<=", ">=", "<", ">"], Self::additive)
    }
    fn additive(&mut self) -> Result<Expr, ExprError> {
        self.binary_level(&["+", "-"], Self::multiplicative)
    }
    fn multiplicative(&mut self) -> Result<Expr, ExprError> {
        self.binary_level(&["*", "/", "%"], Self::unary)
    }

    fn unary(&mut self) -> Result<Expr, ExprError> {
        if self.eat_op("!") || self.eat_word("not") {
            return Ok(Expr::Unary("!", Box::new(self.unary()?)));
        }
        if self.eat_op("-") {
            return Ok(Expr::Unary("-", Box::new(self.unary()?)));
        }
        if self.eat_op("+") {
            return self.unary();
        }
        self.postfix()
    }

    fn postfix(&mut self) -> Result<Expr, ExprError> {
        let mut e = self.primary()?;
        loop {
            if self.eat_op(".") {
                let at = self.offset();
                match self.bump() {
                    Tok::Ident(n) => e = Expr::Member(Box::new(e), n),
                    Tok::Num(n) if n.fract() == 0.0 && n >= 0.0 => {
                        e = Expr::Index(Box::new(e), Box::new(Expr::Lit(num(n))))
                    }
                    _ => return err("expected a field name after '.'", at),
                }
            } else if self.eat_op("[") {
                let idx = self.expr()?;
                self.expect_op("]")?;
                e = Expr::Index(Box::new(e), Box::new(idx));
            } else {
                return Ok(e);
            }
        }
    }

    fn args(&mut self, close: &str) -> Result<Vec<Expr>, ExprError> {
        let mut args = Vec::new();
        if self.eat_op(close) {
            return Ok(args);
        }
        loop {
            args.push(self.expr()?);
            if self.eat_op(",") {
                continue;
            }
            self.expect_op(close)?;
            return Ok(args);
        }
    }

    fn primary(&mut self) -> Result<Expr, ExprError> {
        let at = self.offset();
        match self.bump() {
            Tok::Num(n) => Ok(Expr::Lit(num(n))),
            Tok::Str(s) => Ok(Expr::Lit(Value::String(s))),
            Tok::Ident(id) => match id.as_str() {
                "true" => Ok(Expr::Lit(Value::Bool(true))),
                "false" => Ok(Expr::Lit(Value::Bool(false))),
                "null" | "undefined" | "none" => Ok(Expr::Lit(Value::Null)),
                _ => {
                    if self.eat_op("(") {
                        let args = self.args(")")?;
                        Ok(Expr::Call(id, args))
                    } else {
                        Ok(Expr::Var(id))
                    }
                }
            },
            Tok::Op("(") => {
                let e = self.expr()?;
                self.expect_op(")")?;
                Ok(e)
            }
            Tok::Op("[") => Ok(Expr::List(self.args("]")?)),
            Tok::End => err("unexpected end of expression", at),
            Tok::Op(o) => err(format!("unexpected '{o}'"), at),
        }
    }
}

/// Parse an expression. `{{ }}` delimiters are stripped if present.
pub fn parse(src: &str) -> Result<Expr, ExprError> {
    let mut s = src.trim();
    if s.starts_with("{{") && s.ends_with("}}") && s.len() >= 4 {
        s = s[2..s.len() - 2].trim();
    }
    if s.is_empty() {
        return err("empty expression", 0);
    }
    let toks = lex(s)?;
    let mut p = Parser { toks, pos: 0 };
    let e = p.expr()?;
    if !matches!(p.peek(), Tok::End) {
        return err("unexpected trailing input", p.offset());
    }
    Ok(e)
}

// ---------------------------------------------------------------------------
// Templates: literal text with {{ expr }} holes
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq)]
pub enum Segment {
    Lit(String),
    Expr(String, Expr),
}

/// Split a template string into literal and expression segments.
pub fn parse_template(src: &str) -> Result<Vec<Segment>, ExprError> {
    let mut out = Vec::new();
    let mut rest = src;
    let mut base = 0;
    while let Some(start) = rest.find("{{") {
        if start > 0 {
            out.push(Segment::Lit(rest[..start].to_string()));
        }
        let after = &rest[start + 2..];
        let Some(end) = after.find("}}") else {
            return err("missing closing '}}'", base + start);
        };
        let inner = after[..end].trim();
        let e = parse(inner).map_err(|mut e| {
            e.offset += base + start + 2;
            e
        })?;
        out.push(Segment::Expr(inner.to_string(), e));
        let consumed = start + 2 + end + 2;
        base += consumed;
        rest = &rest[consumed..];
    }
    if !rest.is_empty() {
        out.push(Segment::Lit(rest.to_string()));
    }
    Ok(out)
}

pub fn has_template(src: &str) -> bool {
    src.contains("{{") && src.contains("}}")
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/// Evaluation context: root data, local variables and a record of missing paths.
pub struct Scope<'a> {
    root: &'a Value,
    locals: Vec<(String, Value)>,
    missing: &'a RefCell<BTreeSet<String>>,
    pub now: &'a str,
}

impl<'a> Scope<'a> {
    pub fn new(root: &'a Value, missing: &'a RefCell<BTreeSet<String>>, now: &'a str) -> Self {
        Self { root, locals: Vec::new(), missing, now }
    }

    /// A child scope with an extra local binding.
    pub fn with(&self, name: &str, value: Value) -> Scope<'a> {
        let mut locals = self.locals.clone();
        locals.push((name.to_string(), value));
        Scope { root: self.root, locals, missing: self.missing, now: self.now }
    }

    pub fn with_many(&self, vars: Vec<(&str, Value)>) -> Scope<'a> {
        let mut locals = self.locals.clone();
        for (n, v) in vars {
            locals.push((n.to_string(), v));
        }
        Scope { root: self.root, locals, missing: self.missing, now: self.now }
    }

    /// Missing data paths recorded so far (shared by every scope of one render).
    pub fn missing_paths(&self) -> BTreeSet<String> {
        self.missing.borrow().clone()
    }

    pub fn missing_count(&self) -> usize {
        self.missing.borrow().len()
    }

    fn lookup(&self, name: &str) -> Option<Value> {
        for (n, v) in self.locals.iter().rev() {
            if n == name {
                return Some(v.clone());
            }
        }
        if name == "data" {
            return Some(self.root.clone());
        }
        match self.root {
            Value::Object(m) => m.get(name).cloned(),
            _ => None,
        }
    }

    /// Evaluate an expression string. Parse errors are returned; missing data is not an error.
    pub fn eval_str(&self, src: &str) -> Result<Value, ExprError> {
        let e = parse(src)?;
        Ok(self.eval(&e))
    }

    /// Render a template string to plain text.
    pub fn render_template(&self, src: &str) -> Result<String, ExprError> {
        let mut out = String::new();
        for seg in parse_template(src)? {
            match seg {
                Segment::Lit(s) => out.push_str(&s),
                Segment::Expr(_, e) => out.push_str(&to_text(&self.eval(&e))),
            }
        }
        Ok(out)
    }

    /// Evaluate either a bare expression or a `{{ }}` template.
    /// Values containing `{{` are treated as templates, anything else as an expression.
    pub fn eval_binding(&self, src: &str) -> Result<Value, ExprError> {
        let t = src.trim();
        if t.is_empty() {
            return Ok(Value::Null);
        }
        if t.starts_with("{{") && t.ends_with("}}") && t.matches("{{").count() == 1 {
            return self.eval_str(t);
        }
        if has_template(t) {
            return Ok(Value::String(self.render_template(t)?));
        }
        self.eval_str(t)
    }

    fn record_missing(&self, e: &Expr) {
        if let Some(p) = path_of(e) {
            // Per-row fields are often optional; only report paths into the data root.
            let head = p.split(['.', '[']).next().unwrap_or("");
            if self.locals.iter().any(|(n, _)| n == head) {
                return;
            }
            self.missing.borrow_mut().insert(p);
        }
    }

    pub fn eval(&self, e: &Expr) -> Value {
        match e {
            Expr::Lit(v) => v.clone(),
            Expr::List(items) => Value::Array(items.iter().map(|i| self.eval(i)).collect()),
            Expr::Var(name) => match self.lookup(name) {
                Some(v) => v,
                None => {
                    self.record_missing(e);
                    Value::Null
                }
            },
            Expr::Member(obj, field) => {
                let base = self.eval(obj);
                let v = member(&base, field);
                // A null base was already reported by the inner lookup.
                if v.is_none() && !base.is_null() {
                    self.record_missing(e);
                }
                v.unwrap_or(Value::Null)
            }
            Expr::Index(obj, idx) => {
                let base = self.eval(obj);
                let i = self.eval(idx);
                let v = match (&base, &i) {
                    (Value::Array(a), Value::Number(n)) => {
                        let n = n.as_f64().unwrap_or(0.0);
                        let len = a.len() as i64;
                        let mut k = n as i64;
                        if k < 0 {
                            k += len;
                        }
                        if k >= 0 && k < len {
                            Some(a[k as usize].clone())
                        } else {
                            None
                        }
                    }
                    (Value::Object(_), Value::String(s)) => member(&base, s),
                    _ => None,
                };
                if v.is_none() && !base.is_null() {
                    self.record_missing(e);
                }
                v.unwrap_or(Value::Null)
            }
            Expr::Unary(op, a) => {
                let v = self.eval(a);
                match *op {
                    "!" => Value::Bool(!truthy(&v)),
                    _ => match as_num(&v) {
                        Some(n) => num(-n),
                        None => Value::Null,
                    },
                }
            }
            Expr::Binary(op, a, b) => self.binary(op, a, b),
            Expr::Ternary(c, a, b) => {
                if truthy(&self.eval(c)) {
                    self.eval(a)
                } else {
                    self.eval(b)
                }
            }
            Expr::Call(name, args) => self.call(name, args),
        }
    }

    fn binary(&self, op: &str, a: &Expr, b: &Expr) -> Value {
        match op {
            "&&" => {
                let l = self.eval(a);
                if !truthy(&l) {
                    return l;
                }
                self.eval(b)
            }
            "||" => {
                let l = self.eval(a);
                if truthy(&l) {
                    return l;
                }
                self.eval(b)
            }
            "??" => {
                // Missing lookups on the left are expected here; do not report them.
                let l = {
                    let before = self.missing.borrow().clone();
                    let v = self.eval(a);
                    *self.missing.borrow_mut() = before;
                    v
                };
                if l.is_null() {
                    self.eval(b)
                } else {
                    l
                }
            }
            _ => {
                let l = self.eval(a);
                let r = self.eval(b);
                binop(op, &l, &r)
            }
        }
    }

    fn call(&self, name: &str, args: &[Expr]) -> Value {
        // Higher-order helpers: the second argument is an expression string
        // evaluated once per element with `it` (and `index`) in scope.
        if matches!(name, "each" | "select" | "count" | "any" | "all") && args.len() == 2 {
            let list = match self.eval(&args[0]) {
                Value::Array(a) => a,
                Value::Null => Vec::new(),
                other => vec![other],
            };
            let body = match self.eval(&args[1]) {
                Value::String(src) => match parse(&src) {
                    Ok(e) => e,
                    Err(_) => return Value::Null,
                },
                _ => return Value::Null,
            };
            let results = list.iter().enumerate().map(|(i, it)| {
                let s = self.with_many(vec![("it", it.clone()), ("index", num(i as f64))]);
                (it, s.eval(&body))
            });
            return match name {
                "each" => Value::Array(results.map(|(_, r)| r).collect()),
                "select" => Value::Array(results.filter(|(_, r)| truthy(r)).map(|(it, _)| it.clone()).collect()),
                "count" => num(results.filter(|(_, r)| truthy(r)).count() as f64),
                "any" => Value::Bool(results.into_iter().any(|(_, r)| truthy(&r))),
                _ => Value::Bool(results.into_iter().all(|(_, r)| truthy(&r))),
            };
        }
        let v: Vec<Value> = args.iter().map(|a| self.eval(a)).collect();
        call_fn(name, &v, self.now)
    }
}

/// Dotted path of a pure path expression (for missing-data reports).
pub fn path_of(e: &Expr) -> Option<String> {
    match e {
        Expr::Var(n) => Some(n.clone()),
        Expr::Member(o, f) => {
            let base = path_of(o)?;
            if base == "data" {
                Some(f.clone())
            } else {
                Some(format!("{base}.{f}"))
            }
        }
        Expr::Index(o, i) => {
            let base = path_of(o)?;
            match &**i {
                Expr::Lit(Value::Number(n)) => Some(format!("{base}[{n}]")),
                Expr::Lit(Value::String(s)) => Some(format!("{base}.{s}")),
                _ => Some(format!("{base}[]")),
            }
        }
        _ => None,
    }
}

/// Collect every data path referenced by an expression (ignoring locals).
pub fn referenced_paths(e: &Expr, locals: &[&str], out: &mut BTreeSet<String>) {
    match e {
        Expr::Var(_) | Expr::Member(..) | Expr::Index(..) => {
            if let Some(p) = path_of(e) {
                let head = p.split(['.', '[']).next().unwrap_or("");
                if !locals.contains(&head) && head != "data" {
                    out.insert(p);
                } else if head == "data" && p != "data" {
                    out.insert(p.trim_start_matches("data.").to_string());
                }
            }
            if let Expr::Index(o, i) = e {
                referenced_paths(o, locals, out);
                referenced_paths(i, locals, out);
            }
        }
        Expr::Lit(_) => {}
        Expr::List(items) | Expr::Call(_, items) => {
            for i in items {
                referenced_paths(i, locals, out)
            }
        }
        Expr::Unary(_, a) => referenced_paths(a, locals, out),
        Expr::Binary(_, a, b) => {
            referenced_paths(a, locals, out);
            referenced_paths(b, locals, out);
        }
        Expr::Ternary(a, b, c) => {
            referenced_paths(a, locals, out);
            referenced_paths(b, locals, out);
            referenced_paths(c, locals, out);
        }
    }
}

/// Every function the evaluator knows. Calls to anything else evaluate to null,
/// so the validator reports them.
pub const FUNCTIONS: &[&str] = &[
    "len",
    "length",
    "count",
    "sum",
    "avg",
    "mean",
    "average",
    "min",
    "max",
    "stdev",
    "stddev",
    "cpk",
    "abs",
    "sqrt",
    "floor",
    "ceil",
    "round",
    "fixed",
    "decimals",
    "percent",
    "si",
    "eng",
    "upper",
    "lower",
    "trim",
    "string",
    "str",
    "text",
    "number",
    "num",
    "default",
    "coalesce",
    "if",
    "join",
    "concat",
    "replace",
    "pad",
    "contains",
    "first",
    "last",
    "pluck",
    "map",
    "where",
    "filter",
    "count_if",
    "countIf",
    "pass_rate",
    "passRate",
    "verdict",
    "in_range",
    "inRange",
    "status",
    "judge",
    "limits",
    "spec",
    "with_unit",
    "withUnit",
    "measure",
    "group_by",
    "groupBy",
    "count_by",
    "countBy",
    "split",
    "lvtime",
    "labview_time",
    "sort",
    "reverse",
    "unique",
    "slice",
    "range",
    "keys",
    "entries",
    "now",
    "date",
    "format_date",
    "formatDate",
    "duration",
    "each",
    "select",
    "any",
    "all",
];

/// Functions whose second argument is an expression string evaluated per element (`it`, `index`).
pub const HIGHER_ORDER: &[&str] = &["each", "select", "count", "any", "all"];

/// Functions whose second argument names a field of each list element.
const FIELD_ARG: &[&str] = &[
    "sum",
    "avg",
    "mean",
    "average",
    "min",
    "max",
    "stdev",
    "stddev",
    "pluck",
    "map",
    "where",
    "filter",
    "count_if",
    "countIf",
    "pass_rate",
    "passRate",
    "verdict",
    "sort",
    "group_by",
    "groupBy",
    "count_by",
    "countBy",
];

/// Levenshtein distance, for "did you mean" hints.
pub fn edit_distance(a: &str, b: &str) -> usize {
    let a: Vec<char> = a.chars().collect();
    let b: Vec<char> = b.chars().collect();
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    for (i, ca) in a.iter().enumerate() {
        let mut cur = vec![i + 1; b.len() + 1];
        for (j, cb) in b.iter().enumerate() {
            let cost = if ca.eq_ignore_ascii_case(cb) { 0 } else { 1 };
            cur[j + 1] = (prev[j] + cost).min(prev[j + 1] + 1).min(cur[j] + 1);
        }
        prev = cur;
    }
    prev[b.len()]
}

/// The closest candidate to `word`, when it is close enough to be a likely typo.
pub fn suggest<'c>(word: &str, candidates: impl IntoIterator<Item = &'c str>) -> Option<&'c str> {
    let limit = (word.chars().count() / 3).clamp(1, 3);
    let lower = word.to_ascii_lowercase();
    candidates
        .into_iter()
        .filter(|c| *c != word)
        .map(|c| {
            // Same letters in another case is the closest possible match.
            let d = if c.to_ascii_lowercase() == lower { 0 } else { edit_distance(word, c) };
            (d, c)
        })
        .filter(|(d, _)| *d <= limit)
        .min_by_key(|(d, _)| *d)
        .map(|(_, c)| c)
}

/// Names of every function an expression calls, including inside higher-order bodies.
pub fn function_names(e: &Expr, out: &mut BTreeSet<String>) {
    match e {
        Expr::Call(name, args) => {
            out.insert(name.clone());
            if HIGHER_ORDER.contains(&name.as_str()) && args.len() == 2 {
                if let Expr::Lit(Value::String(body)) = &args[1] {
                    if let Ok(b) = parse(body) {
                        function_names(&b, out);
                    }
                }
            }
            for a in args {
                function_names(a, out);
            }
        }
        Expr::Member(o, _) | Expr::Unary(_, o) => function_names(o, out),
        Expr::Index(a, b) | Expr::Binary(_, a, b) => {
            function_names(a, out);
            function_names(b, out);
        }
        Expr::Ternary(a, b, c) => {
            function_names(a, out);
            function_names(b, out);
            function_names(c, out);
        }
        Expr::List(items) => items.iter().for_each(|i| function_names(i, out)),
        Expr::Lit(_) | Expr::Var(_) => {}
    }
}

/// Parse errors inside higher-order bodies (`each(list, 'it.value *')`), which are
/// otherwise only strings to the parser.
pub fn body_errors(e: &Expr, out: &mut Vec<ExprError>) {
    match e {
        Expr::Call(name, args) => {
            if HIGHER_ORDER.contains(&name.as_str()) && args.len() == 2 {
                if let Expr::Lit(Value::String(body)) = &args[1] {
                    match parse(body) {
                        Ok(b) => body_errors(&b, out),
                        Err(mut err) => {
                            err.message = format!("in '{body}': {}", err.message);
                            out.push(err)
                        }
                    }
                }
            }
            args.iter().for_each(|a| body_errors(a, out));
        }
        Expr::Member(o, _) | Expr::Unary(_, o) => body_errors(o, out),
        Expr::Index(a, b) | Expr::Binary(_, a, b) => {
            body_errors(a, out);
            body_errors(b, out);
        }
        Expr::Ternary(a, b, c) => {
            body_errors(a, out);
            body_errors(b, out);
            body_errors(c, out);
        }
        Expr::List(items) => items.iter().for_each(|i| body_errors(i, out)),
        Expr::Lit(_) | Expr::Var(_) => {}
    }
}

/// A path an expression reads, including paths through locals (`row.value`).
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct PathUse {
    pub path: String,
    /// Read in a way that tolerates absence: the left of `??`, `default(x, …)`, or a
    /// field named to a list helper (which falls back when it is missing).
    pub optional: bool,
}

/// Collect every path an expression reads. Inside higher-order bodies, `it.x` becomes
/// `<list>[].x` when the list is a plain path.
pub fn path_uses(e: &Expr, out: &mut Vec<PathUse>) {
    fn go(e: &Expr, optional: bool, out: &mut Vec<PathUse>) {
        match e {
            Expr::Var(_) | Expr::Member(..) | Expr::Index(..) => {
                if let Some(p) = path_of(e) {
                    let p = p.strip_prefix("data.").map(str::to_string).unwrap_or(p);
                    if p != "data" {
                        out.push(PathUse { path: p, optional });
                    }
                }
                match e {
                    Expr::Index(o, i) => {
                        if path_of(o).is_none() {
                            go(o, optional, out);
                        }
                        go(i, false, out);
                    }
                    Expr::Member(o, _) if path_of(o).is_none() => go(o, optional, out),
                    _ => {}
                }
            }
            Expr::Lit(_) => {}
            Expr::List(items) => items.iter().for_each(|i| go(i, optional, out)),
            Expr::Call(name, args) => {
                let name = name.as_str();
                let list = args.first().and_then(path_of);
                if HIGHER_ORDER.contains(&name) && args.len() == 2 {
                    go(&args[0], optional, out);
                    if let Expr::Lit(Value::String(body)) = &args[1] {
                        if let Ok(b) = parse(body) {
                            let mut inner = Vec::new();
                            go(&b, optional, &mut inner);
                            for u in inner {
                                let head = u.path.split(['.', '[']).next().unwrap_or("");
                                match head {
                                    "it" => {
                                        if let Some(l) = &list {
                                            let rest = &u.path[2..];
                                            out.push(PathUse { path: format!("{l}[]{rest}"), optional: u.optional });
                                        }
                                    }
                                    "index" => {}
                                    _ => out.push(u),
                                }
                            }
                        }
                    }
                    return;
                }
                if matches!(name, "default" | "coalesce") {
                    let n = args.len();
                    for (i, a) in args.iter().enumerate() {
                        go(a, optional || i + 1 < n, out);
                    }
                    return;
                }
                if FIELD_ARG.contains(&name) {
                    if let (Some(l), Some(Expr::Lit(Value::String(f)))) = (&list, args.get(1)) {
                        if !f.is_empty() && f.chars().all(|c| c.is_alphanumeric() || c == '_') {
                            out.push(PathUse { path: format!("{l}[].{f}"), optional: true });
                        }
                    }
                }
                args.iter().for_each(|a| go(a, optional, out));
            }
            Expr::Unary(_, a) => go(a, optional, out),
            Expr::Binary(op, a, b) => {
                go(a, optional || *op == "??", out);
                go(b, optional, out);
            }
            Expr::Ternary(a, b, c) => {
                go(a, optional, out);
                go(b, optional, out);
                go(c, optional, out);
            }
        }
    }
    go(e, false, out)
}

fn member(v: &Value, field: &str) -> Option<Value> {
    match v {
        Value::Object(m) => m.get(field).cloned(),
        Value::Array(a) if field == "length" => Some(num(a.len() as f64)),
        Value::String(s) if field == "length" => Some(num(s.chars().count() as f64)),
        _ => None,
    }
}

pub fn num(n: f64) -> Value {
    if n.is_finite() {
        if n.fract() == 0.0 && n.abs() < 9.0e15 {
            Value::Number(Number::from(n as i64))
        } else {
            Number::from_f64(n).map(Value::Number).unwrap_or(Value::Null)
        }
    } else {
        Value::Null
    }
}

pub fn truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|f| f != 0.0),
        Value::String(s) => !s.is_empty(),
        Value::Array(a) => !a.is_empty(),
        Value::Object(_) => true,
    }
}

/// Numeric coercion: numbers, numeric strings and booleans.
pub fn as_num(v: &Value) -> Option<f64> {
    match v {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => s.trim().parse::<f64>().ok(),
        Value::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
        _ => None,
    }
}

fn loose_eq(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(_), Value::String(_)) | (Value::String(_), Value::Number(_)) => match (as_num(a), as_num(b)) {
            (Some(x), Some(y)) => x == y,
            _ => false,
        },
        (Value::Number(x), Value::Number(y)) => x.as_f64() == y.as_f64(),
        _ => a == b,
    }
}

fn binop(op: &str, l: &Value, r: &Value) -> Value {
    match op {
        "==" => Value::Bool(loose_eq(l, r)),
        "!=" => Value::Bool(!loose_eq(l, r)),
        "<" | "<=" | ">" | ">=" => {
            let ord = match (l, r) {
                // Two numeric strings ("10" vs "9") compare as numbers, other text as text.
                (Value::String(a), Value::String(b)) => match (a.trim().parse::<f64>(), b.trim().parse::<f64>()) {
                    (Ok(x), Ok(y)) => x.partial_cmp(&y),
                    _ => Some(a.cmp(b)),
                },
                _ => match (as_num(l), as_num(r)) {
                    (Some(a), Some(b)) => a.partial_cmp(&b),
                    _ => None,
                },
            };
            let Some(o) = ord else { return Value::Bool(false) };
            Value::Bool(match op {
                "<" => o.is_lt(),
                "<=" => o.is_le(),
                ">" => o.is_gt(),
                _ => o.is_ge(),
            })
        }
        "+" => match (l, r) {
            (Value::String(a), _) => Value::String(format!("{a}{}", to_text(r))),
            (_, Value::String(b)) => Value::String(format!("{}{b}", to_text(l))),
            (Value::Array(a), Value::Array(b)) => Value::Array(a.iter().chain(b).cloned().collect()),
            _ => arith(l, r, |a, b| a + b),
        },
        "-" => arith(l, r, |a, b| a - b),
        "*" => arith(l, r, |a, b| a * b),
        "/" => arith(l, r, |a, b| if b == 0.0 { f64::NAN } else { a / b }),
        "%" => arith(l, r, |a, b| if b == 0.0 { f64::NAN } else { a % b }),
        _ => Value::Null,
    }
}

fn arith(l: &Value, r: &Value, f: impl Fn(f64, f64) -> f64) -> Value {
    match (as_num(l), as_num(r)) {
        (Some(a), Some(b)) => num(f(a, b)),
        _ => Value::Null,
    }
}

/// Default textual rendering of a value.
pub fn to_text(v: &Value) -> String {
    match v {
        Value::Null => String::new(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => format_number(n.as_f64().unwrap_or(0.0)),
        Value::String(s) => s.clone(),
        Value::Array(a) => a.iter().map(to_text).collect::<Vec<_>>().join(", "),
        Value::Object(_) => serde_json::to_string(v).unwrap_or_default(),
    }
}

/// Render a number without float noise (max 6 decimals, trailing zeros trimmed).
pub fn format_number(n: f64) -> String {
    if !n.is_finite() {
        return String::new();
    }
    if n.fract() == 0.0 && n.abs() < 1e15 {
        return format!("{}", n as i64);
    }
    if n.abs() >= 1e15 || (n != 0.0 && n.abs() < 1e-6) {
        return format!("{n:e}");
    }
    let s = format!("{n:.6}");
    let s = s.trim_end_matches('0').trim_end_matches('.');
    if s == "-0" {
        "0".into()
    } else {
        s.to_string()
    }
}

pub fn fixed(n: f64, decimals: usize) -> String {
    if !n.is_finite() {
        return String::new();
    }
    let s = format!("{n:.decimals$}");
    // Avoid "-0.000"
    if s.trim_start_matches('-').chars().all(|c| c == '0' || c == '.') {
        s.trim_start_matches('-').to_string()
    } else {
        s
    }
}

fn numbers(v: &Value, field: Option<&str>) -> Vec<f64> {
    match v {
        Value::Array(a) => a
            .iter()
            .filter_map(|x| match field {
                Some(f) => member(x, f).and_then(|y| as_num(&y)),
                None => as_num(x),
            })
            .collect(),
        other => as_num(other).into_iter().collect(),
    }
}

fn str_arg(args: &[Value], i: usize) -> Option<String> {
    args.get(i).map(to_text)
}

fn num_arg(args: &[Value], i: usize) -> Option<f64> {
    args.get(i).and_then(as_num)
}

/// Canonical verdict for a status-like value: "PASS", "FAIL", "WARN", "SKIP" or "".
pub fn verdict_of(v: &Value) -> &'static str {
    match v {
        Value::Bool(true) => "PASS",
        Value::Bool(false) => "FAIL",
        Value::String(s) => match s.trim().to_ascii_lowercase().as_str() {
            "pass" | "passed" | "ok" | "good" | "true" | "success" | "go" => "PASS",
            "fail" | "failed" | "ng" | "bad" | "false" | "error" | "nogo" | "no-go" => "FAIL",
            "warn" | "warning" | "marginal" => "WARN",
            "skip" | "skipped" | "n/a" | "na" | "none" | "not run" => "SKIP",
            _ => "",
        },
        _ => "",
    }
}

/// Verdict of a result row: its status field, else value judged against low/high.
pub fn row_verdict(row: &Value, status_field: &str) -> &'static str {
    if !row.is_object() {
        return verdict_of(row);
    }
    let explicit = verdict_of(&member(row, status_field).unwrap_or(Value::Null));
    if !explicit.is_empty() {
        return explicit;
    }
    let g = |k: &str| member(row, k).and_then(|v| as_num(&v));
    limit_verdict(g("value"), g("low"), g("high"))
}

/// Compute PASS/FAIL from a value and optional limits.
pub fn limit_verdict(value: Option<f64>, low: Option<f64>, high: Option<f64>) -> &'static str {
    // Non-finite limits (NaN/Inf, as LabVIEW may send them) mean "no limit".
    let low = low.filter(|l| l.is_finite());
    let high = high.filter(|h| h.is_finite());
    let Some(v) = value else { return "" };
    if low.is_none() && high.is_none() {
        return "";
    }
    // A NaN measurement is a failed measurement, never a pass.
    if !v.is_finite() {
        return "FAIL";
    }
    if low.is_some_and(|l| v < l) || high.is_some_and(|h| v > h) {
        "FAIL"
    } else {
        "PASS"
    }
}

fn call_fn(name: &str, a: &[Value], now: &str) -> Value {
    let first = a.first().cloned().unwrap_or(Value::Null);
    match name {
        "len" | "length" | "count" => match &first {
            Value::Array(x) => num(x.len() as f64),
            Value::String(s) => num(s.chars().count() as f64),
            Value::Object(m) => num(m.len() as f64),
            Value::Null => num(0.0),
            _ => num(1.0),
        },
        "sum" => num(numbers(&first, str_arg(a, 1).as_deref()).iter().sum()),
        "avg" | "mean" | "average" => {
            let n = numbers(&first, str_arg(a, 1).as_deref());
            if n.is_empty() {
                Value::Null
            } else {
                num(n.iter().sum::<f64>() / n.len() as f64)
            }
        }
        "min" | "max" => {
            let mut n = if a.len() > 1 && !a[1].is_string() {
                a.iter().filter_map(as_num).collect::<Vec<_>>()
            } else {
                numbers(&first, str_arg(a, 1).as_deref())
            };
            n.retain(|x| x.is_finite());
            let r = if name == "min" {
                n.iter().cloned().fold(None, |m: Option<f64>, x| Some(m.map_or(x, |m| m.min(x))))
            } else {
                n.iter().cloned().fold(None, |m: Option<f64>, x| Some(m.map_or(x, |m| m.max(x))))
            };
            r.map(num).unwrap_or(Value::Null)
        }
        "stdev" | "stddev" => {
            let n = numbers(&first, str_arg(a, 1).as_deref());
            if n.len() < 2 {
                return Value::Null;
            }
            let mean = n.iter().sum::<f64>() / n.len() as f64;
            let var = n.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n.len() as f64 - 1.0);
            num(var.sqrt())
        }
        "cpk" => {
            // cpk(values, low, high)
            let n = numbers(&first, None);
            let (Some(lo), Some(hi)) = (num_arg(a, 1), num_arg(a, 2)) else { return Value::Null };
            if n.len() < 2 {
                return Value::Null;
            }
            let mean = n.iter().sum::<f64>() / n.len() as f64;
            let sd = (n.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n.len() as f64 - 1.0)).sqrt();
            if sd == 0.0 {
                return Value::Null;
            }
            num(((hi - mean).min(mean - lo)) / (3.0 * sd))
        }
        "abs" => as_num(&first).map(|x| num(x.abs())).unwrap_or(Value::Null),
        "sqrt" => as_num(&first).map(|x| num(x.sqrt())).unwrap_or(Value::Null),
        "floor" => as_num(&first).map(|x| num(x.floor())).unwrap_or(Value::Null),
        "ceil" => as_num(&first).map(|x| num(x.ceil())).unwrap_or(Value::Null),
        "round" => {
            let Some(x) = as_num(&first) else { return Value::Null };
            let d = num_arg(a, 1).unwrap_or(0.0).clamp(0.0, 12.0) as i32;
            let f = 10f64.powi(d);
            num((x * f).round() / f)
        }
        "fixed" | "decimals" => {
            let Some(x) = as_num(&first) else { return Value::String(String::new()) };
            let d = num_arg(a, 1).unwrap_or(2.0).clamp(0.0, 12.0) as usize;
            Value::String(fixed(x, d))
        }
        "percent" => {
            // percent(0.934) -> "93.4 %", percent(93.4, 1, false)
            let Some(x) = as_num(&first) else { return Value::String(String::new()) };
            let d = num_arg(a, 1).unwrap_or(1.0).clamp(0.0, 6.0) as usize;
            let already = a.get(2).map(truthy).unwrap_or(false);
            let v = if already { x } else { x * 100.0 };
            Value::String(format!("{} %", fixed(v, d)))
        }
        "si" | "eng" => {
            // Engineering notation with SI prefix: si(0.0047, "F") -> "4.7 mF"
            let Some(x) = as_num(&first) else { return Value::String(String::new()) };
            let unit = str_arg(a, 1).unwrap_or_default();
            let d = num_arg(a, 2).unwrap_or(3.0).clamp(0.0, 6.0) as usize;
            Value::String(format_si(x, &unit, d))
        }
        "upper" => Value::String(to_text(&first).to_uppercase()),
        "lower" => Value::String(to_text(&first).to_lowercase()),
        "trim" => Value::String(to_text(&first).trim().to_string()),
        "string" | "str" | "text" => Value::String(to_text(&first)),
        "number" | "num" => as_num(&first).map(num).unwrap_or(Value::Null),
        "default" | "coalesce" => {
            a.iter().find(|v| !v.is_null() && !to_text(v).is_empty()).cloned().unwrap_or(Value::Null)
        }
        "if" => {
            if truthy(&first) {
                a.get(1).cloned().unwrap_or(Value::Null)
            } else {
                a.get(2).cloned().unwrap_or(Value::Null)
            }
        }
        "join" => match &first {
            Value::Array(x) => {
                let sep = str_arg(a, 1).unwrap_or_else(|| ", ".into());
                Value::String(x.iter().map(to_text).collect::<Vec<_>>().join(&sep))
            }
            other => Value::String(to_text(other)),
        },
        "concat" => Value::String(a.iter().map(to_text).collect()),
        "replace" => {
            let s = to_text(&first);
            let from = str_arg(a, 1).unwrap_or_default();
            let to = str_arg(a, 2).unwrap_or_default();
            if from.is_empty() {
                Value::String(s)
            } else {
                Value::String(s.replace(&from, &to))
            }
        }
        "pad" => {
            // pad(7, 3) -> "007"
            let s = to_text(&first);
            let w = num_arg(a, 1).unwrap_or(0.0).clamp(0.0, 64.0) as usize;
            let ch = str_arg(a, 2).and_then(|c| c.chars().next()).unwrap_or('0');
            let n = s.chars().count();
            Value::String(if n >= w { s } else { format!("{}{s}", ch.to_string().repeat(w - n)) })
        }
        "contains" => match &first {
            Value::Array(x) => Value::Bool(a.get(1).is_some_and(|n| x.iter().any(|i| loose_eq(i, n)))),
            other => Value::Bool(to_text(other).contains(&str_arg(a, 1).unwrap_or_default())),
        },
        "first" => match &first {
            Value::Array(x) => x.first().cloned().unwrap_or(Value::Null),
            _ => Value::Null,
        },
        "last" => match &first {
            Value::Array(x) => x.last().cloned().unwrap_or(Value::Null),
            _ => Value::Null,
        },
        "pluck" | "map" => match &first {
            Value::Array(x) => {
                let f = str_arg(a, 1).unwrap_or_default();
                Value::Array(x.iter().map(|i| member(i, &f).unwrap_or(Value::Null)).collect())
            }
            _ => Value::Array(vec![]),
        },
        "where" | "filter" => match &first {
            Value::Array(x) => {
                let f = str_arg(a, 1).unwrap_or_default();
                let want = a.get(2).cloned().unwrap_or(Value::Bool(true));
                Value::Array(x.iter().filter(|i| row_matches(i, &f, &want)).cloned().collect())
            }
            _ => Value::Array(vec![]),
        },
        "count_if" | "countIf" => match &first {
            Value::Array(x) => {
                let f = str_arg(a, 1).unwrap_or_default();
                let want = a.get(2).cloned().unwrap_or(Value::Bool(true));
                num(x.iter().filter(|i| row_matches(i, &f, &want)).count() as f64)
            }
            _ => num(0.0),
        },
        "pass_rate" | "passRate" => {
            // pass_rate(results, "status") -> 0..1
            let Value::Array(x) = &first else { return Value::Null };
            let f = str_arg(a, 1).unwrap_or_else(|| "status".into());
            let judged: Vec<&'static str> =
                x.iter().map(|i| row_verdict(i, &f)).filter(|v| *v == "PASS" || *v == "FAIL").collect();
            if judged.is_empty() {
                return Value::Null;
            }
            num(judged.iter().filter(|v| **v == "PASS").count() as f64 / judged.len() as f64)
        }
        "verdict" => {
            // verdict(x) canonicalises; verdict(array, "status") rolls up
            match &first {
                Value::Array(x) => {
                    let f = str_arg(a, 1).unwrap_or_else(|| "status".into());
                    Value::String(rollup(x.iter().map(|i| row_verdict(i, &f))).into())
                }
                other => Value::String(verdict_of(other).into()),
            }
        }
        "in_range" | "inRange" => {
            let (Some(v), lo, hi) = (as_num(&first), num_arg(a, 1), num_arg(a, 2)) else { return Value::Bool(false) };
            Value::Bool(limit_verdict(Some(v), lo, hi) == "PASS")
        }
        "status" | "judge" => {
            // status(value, low, high[, margin]): margin is a fraction of the limit span;
            // a passing value that close to a limit is WARN.
            let (v, lo, hi) = (as_num(&first), num_arg(a, 1), num_arg(a, 2));
            let verdict = limit_verdict(v, lo, hi);
            if verdict == "PASS" {
                if let (Some(m), Some(x)) = (num_arg(a, 3).filter(|m| *m > 0.0), v) {
                    if near_limit(x, lo, hi, m) {
                        return Value::String("WARN".into());
                    }
                }
            }
            Value::String(verdict.into())
        }
        "limits" | "spec" => {
            // limits(low, high, unit, digits) -> "4.75 … 5.25 V", "≥ 4.75 V", "≤ 5.25 V"
            let unit = str_arg(a, 2).unwrap_or_default();
            let d = num_arg(a, 3).map(|d| d.clamp(0.0, 12.0) as usize);
            let f = |x: f64| match d {
                Some(d) => fixed(x, d),
                None => format_number(x),
            };
            let lo = as_num(&first).filter(|x| x.is_finite());
            let hi = num_arg(a, 1).filter(|x| x.is_finite());
            let text = match (lo, hi) {
                (Some(l), Some(h)) => format!("{} … {}", f(l), f(h)),
                (Some(l), None) => format!("≥ {}", f(l)),
                (None, Some(h)) => format!("≤ {}", f(h)),
                (None, None) => return Value::String(String::new()),
            };
            Value::String(if unit.is_empty() { text } else { format!("{text} {unit}") })
        }
        "with_unit" | "withUnit" | "measure" => {
            // with_unit(4.98765, "V", 3) -> "4.988 V"; empty when the value is missing.
            let unit = str_arg(a, 1).unwrap_or_default();
            let text = match &first {
                Value::Null => return Value::String(String::new()),
                v => match (as_num(v), num_arg(a, 2)) {
                    (Some(x), Some(d)) => fixed(x, d.clamp(0.0, 12.0) as usize),
                    (Some(x), None) => format_number(x),
                    _ => to_text(v),
                },
            };
            if text.is_empty() {
                return Value::String(text);
            }
            Value::String(if unit.is_empty() { text } else { format!("{text} {unit}") })
        }
        "group_by" | "groupBy" => {
            // group_by(list, "field") -> [{key, count, items}], in first-seen order
            let Value::Array(x) = &first else { return Value::Array(vec![]) };
            let f = str_arg(a, 1).unwrap_or_default();
            let mut groups: Vec<(Value, Vec<Value>)> = Vec::new();
            for i in x {
                let k = if f.is_empty() { i.clone() } else { member(i, &f).unwrap_or(Value::Null) };
                match groups.iter_mut().find(|(g, _)| loose_eq(g, &k)) {
                    Some((_, items)) => items.push(i.clone()),
                    None => groups.push((k, vec![i.clone()])),
                }
            }
            Value::Array(
                groups
                    .into_iter()
                    .map(|(k, items)| {
                        let mut o = Map::new();
                        o.insert("key".into(), k);
                        o.insert("count".into(), num(items.len() as f64));
                        o.insert("items".into(), Value::Array(items));
                        Value::Object(o)
                    })
                    .collect(),
            )
        }
        "count_by" | "countBy" => {
            // count_by(list, "field") -> [{key, count}], most frequent first (a Pareto)
            let Value::Array(x) = &first else { return Value::Array(vec![]) };
            let f = str_arg(a, 1).unwrap_or_default();
            let mut groups: Vec<(Value, usize)> = Vec::new();
            for i in x {
                let k = if f.is_empty() { i.clone() } else { member(i, &f).unwrap_or(Value::Null) };
                if k.is_null() {
                    continue;
                }
                match groups.iter_mut().find(|(g, _)| loose_eq(g, &k)) {
                    Some((_, n)) => *n += 1,
                    None => groups.push((k, 1)),
                }
            }
            groups.sort_by_key(|g| std::cmp::Reverse(g.1));
            Value::Array(
                groups
                    .into_iter()
                    .map(|(k, n)| {
                        let mut o = Map::new();
                        o.insert("key".into(), k);
                        o.insert("count".into(), num(n as f64));
                        Value::Object(o)
                    })
                    .collect(),
            )
        }
        "split" => {
            let sep = str_arg(a, 1).unwrap_or_else(|| ",".into());
            let s = to_text(&first);
            if s.is_empty() {
                return Value::Array(vec![]);
            }
            if sep.is_empty() {
                return Value::Array(s.chars().map(|c| Value::String(c.to_string())).collect());
            }
            Value::Array(s.split(sep.as_str()).map(|p| Value::String(p.trim().to_string())).collect())
        }
        "lvtime" | "labview_time" => {
            // LabVIEW timestamp (seconds since 1904) -> ISO 8601 UTC
            let Some(x) = as_num(&first) else { return Value::String(String::new()) };
            let unix = x - crate::datetime::LABVIEW_EPOCH_OFFSET;
            match chrono::DateTime::from_timestamp(unix.floor() as i64, (unix.fract() * 1e9) as u32) {
                Some(d) => Value::String(d.to_rfc3339_opts(chrono::SecondsFormat::Secs, true)),
                None => Value::String(String::new()),
            }
        }
        "sort" => match &first {
            Value::Array(x) => {
                let mut x = x.clone();
                let f = str_arg(a, 1);
                x.sort_by(|p, q| {
                    let (p, q) = match &f {
                        Some(f) => (member(p, f).unwrap_or(Value::Null), member(q, f).unwrap_or(Value::Null)),
                        None => (p.clone(), q.clone()),
                    };
                    match (as_num(&p), as_num(&q)) {
                        (Some(a), Some(b)) => a.partial_cmp(&b).unwrap_or(std::cmp::Ordering::Equal),
                        _ => to_text(&p).cmp(&to_text(&q)),
                    }
                });
                Value::Array(x)
            }
            other => other.clone(),
        },
        "reverse" => match &first {
            Value::Array(x) => Value::Array(x.iter().rev().cloned().collect()),
            Value::String(s) => Value::String(s.chars().rev().collect()),
            other => other.clone(),
        },
        "unique" => match &first {
            Value::Array(x) => {
                let mut out: Vec<Value> = Vec::new();
                for i in x {
                    if !out.iter().any(|o| loose_eq(o, i)) {
                        out.push(i.clone());
                    }
                }
                Value::Array(out)
            }
            other => other.clone(),
        },
        "slice" => match &first {
            Value::Array(x) => {
                let len = x.len() as i64;
                let norm = |v: f64| {
                    let v = v as i64;
                    (if v < 0 { v + len } else { v }).clamp(0, len) as usize
                };
                let s = norm(num_arg(a, 1).unwrap_or(0.0));
                let e = num_arg(a, 2).map(norm).unwrap_or(x.len());
                Value::Array(if s < e { x[s..e].to_vec() } else { vec![] })
            }
            other => {
                let s: Vec<char> = to_text(other).chars().collect();
                let st = (num_arg(a, 1).unwrap_or(0.0).max(0.0) as usize).min(s.len());
                let en = num_arg(a, 2).map(|e| (e.max(0.0) as usize).min(s.len())).unwrap_or(s.len());
                Value::String(if st < en { s[st..en].iter().collect() } else { String::new() })
            }
        },
        "range" => {
            let n = as_num(&first).unwrap_or(0.0).clamp(0.0, 100_000.0) as usize;
            Value::Array((0..n).map(|i| num(i as f64)).collect())
        }
        "keys" => match &first {
            Value::Object(m) => Value::Array(m.keys().map(|k| Value::String(k.clone())).collect()),
            _ => Value::Array(vec![]),
        },
        "entries" => match &first {
            Value::Object(m) => Value::Array(
                m.iter()
                    .map(|(k, v)| {
                        let mut o = Map::new();
                        o.insert("key".into(), Value::String(k.clone()));
                        o.insert("value".into(), v.clone());
                        Value::Object(o)
                    })
                    .collect(),
            ),
            _ => Value::Array(vec![]),
        },
        "now" => Value::String(now.to_string()),
        "date" | "format_date" | "formatDate" => {
            // `date()` is the render time; `date(missing)` stays empty rather than showing today.
            if a.is_empty() {
                return Value::String(
                    crate::datetime::format(&Value::String(now.into()), "YYYY-MM-DD").unwrap_or_default(),
                );
            }
            if first.is_null() || to_text(&first).trim().is_empty() {
                return Value::String(String::new());
            }
            let src = first.clone();
            let fmt = str_arg(a, 1).unwrap_or_else(|| "YYYY-MM-DD".into());
            Value::String(crate::datetime::format(&src, &fmt).unwrap_or_else(|| to_text(&src)))
        }
        "duration" => {
            // duration(seconds) -> "1 h 02 min 05 s"
            let Some(s) = as_num(&first) else { return Value::String(String::new()) };
            Value::String(format_duration(s))
        }
        _ => Value::Null,
    }
}

/// Is a passing value within `margin` (a fraction of the limit span, or of the one limit) of a limit?
fn near_limit(x: f64, lo: Option<f64>, hi: Option<f64>, margin: f64) -> bool {
    let lo = lo.filter(|l| l.is_finite());
    let hi = hi.filter(|h| h.is_finite());
    let band = match (lo, hi) {
        (Some(l), Some(h)) => (h - l).abs() * margin,
        (Some(l), None) => l.abs() * margin,
        (None, Some(h)) => h.abs() * margin,
        (None, None) => return false,
    };
    lo.is_some_and(|l| x - l < band) || hi.is_some_and(|h| h - x < band)
}

fn row_matches(row: &Value, field: &str, want: &Value) -> bool {
    let v = member(row, field).unwrap_or(Value::Null);
    if v.is_null() {
        if let Value::String(w) = want {
            let canon = verdict_of(&Value::String(w.clone()));
            if !canon.is_empty() {
                return row_verdict(row, field) == canon;
            }
        }
    }
    field_matches(&v, want)
}

fn field_matches(v: &Value, want: &Value) -> bool {
    match want {
        Value::String(w) => {
            let canon = verdict_of(&Value::String(w.clone()));
            if !canon.is_empty() && !verdict_of(v).is_empty() {
                verdict_of(v) == canon
            } else {
                loose_eq(v, want)
            }
        }
        Value::Bool(true) => truthy(v),
        Value::Bool(false) => !truthy(v),
        other => loose_eq(v, other),
    }
}

/// Roll up many verdicts: any FAIL → FAIL, any WARN → WARN, any PASS → PASS.
pub fn rollup<'a>(verdicts: impl Iterator<Item = &'a str>) -> &'static str {
    let mut seen_pass = false;
    let mut seen_warn = false;
    for v in verdicts {
        match v {
            "FAIL" => return "FAIL",
            "WARN" => seen_warn = true,
            "PASS" => seen_pass = true,
            _ => {}
        }
    }
    if seen_warn {
        "WARN"
    } else if seen_pass {
        "PASS"
    } else {
        ""
    }
}

pub fn format_si(x: f64, unit: &str, decimals: usize) -> String {
    if x == 0.0 || !x.is_finite() {
        return format!("{} {unit}", fixed(if x.is_finite() { x } else { 0.0 }, 0)).trim().to_string();
    }
    const PREFIXES: [(i32, &str); 11] = [
        (-15, "f"),
        (-12, "p"),
        (-9, "n"),
        (-6, "µ"),
        (-3, "m"),
        (0, ""),
        (3, "k"),
        (6, "M"),
        (9, "G"),
        (12, "T"),
        (15, "P"),
    ];
    let exp = ((x.abs().log10() / 3.0).floor() as i32 * 3).clamp(-15, 15);
    let prefix = PREFIXES.iter().find(|(e, _)| *e == exp).map(|(_, p)| *p).unwrap_or("");
    let scaled = x / 10f64.powi(exp);
    let text = fixed(scaled, decimals);
    let text = if text.contains('.') { text.trim_end_matches('0').trim_end_matches('.').to_string() } else { text };
    format!("{text} {prefix}{unit}").trim().to_string()
}

pub fn format_duration(secs: f64) -> String {
    if !secs.is_finite() || secs < 0.0 {
        return String::new();
    }
    if secs < 60.0 {
        return format!("{} s", format_number((secs * 10.0).round() / 10.0));
    }
    let total = secs.round() as u64;
    let (h, m, s) = (total / 3600, (total % 3600) / 60, total % 60);
    if h > 0 {
        format!("{h} h {m:02} min {s:02} s")
    } else {
        format!("{m} min {s:02} s")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn ev(src: &str, data: Value) -> Value {
        let missing = RefCell::new(BTreeSet::new());
        let scope = Scope::new(&data, &missing, "2026-03-01T10:20:30Z");
        scope.eval_str(src).unwrap()
    }

    #[test]
    fn paths_and_legacy_prefix() {
        let d = json!({"meta": {"title": "T"}, "list": [1, 2, 3]});
        assert_eq!(ev("meta.title", d.clone()), json!("T"));
        assert_eq!(ev("data.meta.title", d.clone()), json!("T"));
        assert_eq!(ev("{{data.meta.title}}", d.clone()), json!("T"));
        assert_eq!(ev("list[1]", d.clone()), json!(2));
        assert_eq!(ev("list[-1]", d.clone()), json!(3));
        assert_eq!(ev("list.length", d.clone()), json!(3));
        assert_eq!(ev("list.0", d), json!(1));
    }

    #[test]
    fn operators() {
        let d = json!({"v": 5, "lo": 1, "hi": 10, "s": "PASS"});
        assert_eq!(ev("v >= lo && v <= hi", d.clone()), json!(true));
        assert_eq!(ev("v > hi or s == 'PASS'", d.clone()), json!(true));
        assert_eq!(ev("not (v > 3)", d.clone()), json!(false));
        assert_eq!(ev("s === 'PASS' ? 'ok' : 'ng'", d.clone()), json!("ok"));
        assert_eq!(ev("missing ?? 'n/a'", d.clone()), json!("n/a"));
        assert_eq!(ev("1 + 2 * 3", d.clone()), json!(7));
        assert_eq!(ev("(1 + 2) * 3", d.clone()), json!(9));
        assert_eq!(ev("'a' + v", d.clone()), json!("a5"));
        assert_eq!(ev("v / 0", d.clone()), Value::Null);
        assert_eq!(ev("-v", d.clone()), json!(-5));
        assert_eq!(ev("'5' == 5", d), json!(true));
    }

    #[test]
    fn functions_and_pipes() {
        let d = json!({"m": [
            {"name": "a", "value": 1.0, "status": "PASS"},
            {"name": "b", "value": 3.0, "status": "fail"},
            {"name": "c", "value": 2.0, "status": "Passed"}
        ], "x": 4.56789});
        assert_eq!(ev("x | fixed(2)", d.clone()), json!("4.57"));
        assert_eq!(ev("round(x, 3)", d.clone()), json!(4.568));
        assert_eq!(ev("len(m)", d.clone()), json!(3));
        assert_eq!(ev("sum(m, 'value')", d.clone()), json!(6));
        assert_eq!(ev("avg(m, 'value')", d.clone()), json!(2));
        assert_eq!(ev("max(m, 'value')", d.clone()), json!(3));
        assert_eq!(ev("max(1, 9, 4)", d.clone()), json!(9));
        assert_eq!(ev("count_if(m, 'status', 'PASS')", d.clone()), json!(2));
        assert_eq!(ev("verdict(m, 'status')", d.clone()), json!("FAIL"));
        assert_eq!(ev("pass_rate(m) | percent(1)", d.clone()), json!("66.7 %"));
        assert_eq!(ev("pluck(m, 'name') | join('/')", d.clone()), json!("a/b/c"));
        assert_eq!(ev("len(where(m, 'status', 'fail'))", d.clone()), json!(1));
        assert_eq!(ev("status(5, 1, 10)", d.clone()), json!("PASS"));
        assert_eq!(ev("status(11, 1, 10)", d.clone()), json!("FAIL"));
        assert_eq!(ev("status(11, 'NaN', 10)", d.clone()), json!("FAIL"));
        assert_eq!(ev("status(5, 'NaN', 'Infinity')", d.clone()), json!(""));
        assert_eq!(ev("status('NaN', 1, 10)", d.clone()), json!("FAIL"));
        assert_eq!(ev("si(0.0047, 'F')", d.clone()), json!("4.7 mF"));
        assert_eq!(ev("pad(7, 3)", d.clone()), json!("007"));
        assert_eq!(ev("date('2026-03-01T10:20:30Z', 'DD.MM.YYYY HH:mm')", d.clone()), json!("01.03.2026 10:20"));
        assert_eq!(ev("duration(3725)", d.clone()), json!("1 h 02 min 05 s"));
        assert_eq!(ev("each(m, 'it.value * 2')", d.clone()), json!([2, 6, 4]));
        assert_eq!(ev("count(m, 'it.value > 1.5')", d.clone()), json!(2));
        assert_eq!(ev("len(select(m, \"it.name != 'a'\"))", d.clone()), json!(2));
        assert_eq!(ev("all(m, 'it.value > 0')", d.clone()), json!(true));
        assert_eq!(ev("any(m, 'it.value > 5')", d.clone()), json!(false));
        assert_eq!(ev("verdict(each(m, 'status(it.value, 0, 2.5)'))", d), json!("FAIL"));
    }

    #[test]
    fn templates() {
        let d = json!({"sn": "X1", "v": 2.5});
        let missing = RefCell::new(BTreeSet::new());
        let s = Scope::new(&d, &missing, "");
        assert_eq!(s.render_template("SN {{ sn }} at {{v | fixed(1)}} V").unwrap(), "SN X1 at 2.5 V");
        assert_eq!(s.render_template("{{ nope.deep }}!").unwrap(), "!");
        assert!(missing.borrow().contains("nope"));
        assert_eq!(s.eval_binding("{{ v }}").unwrap(), json!(2.5));
        assert_eq!(s.eval_binding("v * 2").unwrap(), json!(5));
    }

    #[test]
    fn locals_shadow_root() {
        let d = json!({"row": "root"});
        let missing = RefCell::new(BTreeSet::new());
        let s = Scope::new(&d, &missing, "");
        let inner = s.with("row", json!({"a": 1}));
        assert_eq!(inner.eval_str("row.a").unwrap(), json!(1));
    }

    #[test]
    fn parse_errors() {
        assert!(parse("1 +").is_err());
        assert!(parse("a b").is_err());
        assert!(parse("'open").is_err());
        assert!(parse("").is_err());
        assert!(parse_template("{{ a ").is_err());
        let e = parse("foo(1,").unwrap_err();
        assert!(e.message.contains("unexpected end"));
    }

    #[test]
    fn referenced() {
        let e = parse("len(results) > 0 && row.x == dut.sn").unwrap();
        let mut out = BTreeSet::new();
        referenced_paths(&e, &["row"], &mut out);
        assert_eq!(out.into_iter().collect::<Vec<_>>(), vec!["dut.sn".to_string(), "results".to_string()]);
    }

    #[test]
    fn new_helpers() {
        let d = json!({"m": [
            {"code": "E1", "v": 1}, {"code": "E2", "v": 2}, {"code": "E1", "v": 3}
        ]});
        assert_eq!(ev("limits(4.75, 5.25, 'V')", d.clone()), json!("4.75 … 5.25 V"));
        assert_eq!(ev("limits(4.75, null, 'V', 1)", d.clone()), json!("≥ 4.8 V"));
        assert_eq!(ev("limits(null, 'NaN')", d.clone()), json!(""));
        assert_eq!(ev("limits(null, 5)", d.clone()), json!("≤ 5"));
        assert_eq!(ev("with_unit(4.98765, 'V', 3)", d.clone()), json!("4.988 V"));
        assert_eq!(ev("with_unit(null, 'V')", d.clone()), json!(""));
        assert_eq!(ev("count_by(m, 'code')", d.clone()), json!([{"key": "E1", "count": 2}, {"key": "E2", "count": 1}]));
        assert_eq!(ev("len(group_by(m, 'code')[0].items)", d.clone()), json!(2));
        assert_eq!(ev("status(9.9, 0, 10, 0.05)", d.clone()), json!("WARN"));
        assert_eq!(ev("status(5, 0, 10, 0.05)", d.clone()), json!("PASS"));
        assert_eq!(ev("split('a, b,c')", d.clone()), json!(["a", "b", "c"]));
        assert_eq!(ev("lvtime(3855205230)", d.clone()), json!("2026-03-01T10:20:30Z"));
        // Missing dates stay empty instead of showing the render time.
        assert_eq!(ev("date(nope)", d.clone()), json!(""));
        assert_eq!(ev("date()", d.clone()), json!("2026-03-01"));
        // Numeric strings compare as numbers.
        assert_eq!(ev("'10' > '9'", d.clone()), json!(true));
        assert_eq!(ev("'b' > 'a'", d), json!(true));
    }

    #[test]
    fn suggestions_and_paths() {
        assert_eq!(suggest("fixd", FUNCTIONS.iter().copied()), Some("fixed"));
        assert_eq!(suggest("zzzzzz", FUNCTIONS.iter().copied()), None);
        let e = parse("count(results, 'it.value > it.high') + default(x.y, 0) + (a ?? b)").unwrap();
        let mut u = Vec::new();
        path_uses(&e, &mut u);
        let got: Vec<_> = u.iter().map(|p| (p.path.as_str(), p.optional)).collect();
        assert!(got.contains(&("results", false)));
        assert!(got.contains(&("results[].value", false)));
        assert!(got.contains(&("results[].high", false)));
        assert!(got.contains(&("x.y", true)));
        assert!(got.contains(&("a", true)));
        assert!(got.contains(&("b", false)));
    }

    #[test]
    fn number_formatting() {
        assert_eq!(format_number(0.1 + 0.2), "0.3");
        assert_eq!(format_number(12.0), "12");
        assert_eq!(fixed(-0.0001, 2), "0.00");
        assert_eq!(format_si(1500.0, "Hz", 2), "1.5 kHz");
    }
}
