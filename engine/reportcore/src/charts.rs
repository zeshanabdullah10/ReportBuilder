//! Deterministic SVG charts for print.
//!
//! Charts are drawn in point units so a chart placed at the full content width
//! renders with true 7–8 pt labels. Marks follow the print spec: 1.5 pt lines,
//! hairline recessive grid, bars capped in width with a surface gap, limit
//! lines in the theme's fail colour with a text label (never colour alone).

use crate::model::{ChartKind, Theme};
use std::fmt::Write;

/// Validated categorical order (blue, orange, aqua, yellow, magenta, green, violet, red).
pub const PALETTE: [&str; 8] = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

#[derive(Debug, Clone, PartialEq)]
pub enum XVal {
    Num(f64),
    Cat(String),
}

#[derive(Debug, Clone)]
pub struct SeriesData {
    pub label: String,
    pub points: Vec<(XVal, f64)>,
    pub color: Option<String>,
}

#[derive(Debug, Clone)]
pub struct LimitData {
    pub label: String,
    pub value: f64,
    pub color: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ChartData {
    pub kind: ChartKind,
    pub series: Vec<SeriesData>,
    pub limits: Vec<LimitData>,
    pub x_label: String,
    pub y_label: String,
    pub bins: u32,
    pub legend: bool,
    pub grid: bool,
}

/// Font stack for SVG text: the bundled theme font first (used by the PDF),
/// then fallbacks for SVG previews shown in a browser without that font.
pub fn font_stack(theme: &Theme) -> String {
    let fallback = match theme.font {
        crate::model::FontFamily::Serif => "Georgia, 'Times New Roman', serif",
        crate::model::FontFamily::Mono => "Menlo, Consolas, monospace",
        crate::model::FontFamily::Sans => "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
    };
    format!("{}, {fallback}", theme.font.typst_name()).replace('"', "'")
}

pub fn esc(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

fn fmt_tick(v: f64, step: f64) -> String {
    // Enough decimals to distinguish consecutive ticks (2.5 → 1, 0.25 → 2).
    let mut decimals = 0usize;
    while decimals < 8 {
        let scaled = step * 10f64.powi(decimals as i32);
        if (scaled - scaled.round()).abs() < 1e-6 * scaled.abs().max(1.0) {
            break;
        }
        decimals += 1;
    }
    let s = format!("{v:.decimals$}");
    if s.trim_start_matches('-').chars().all(|c| c == '0' || c == '.') {
        "0".into()
    } else {
        s
    }
}

/// "Nice" axis ticks covering [lo, hi].
pub fn nice_ticks(lo: f64, hi: f64, target: usize) -> (f64, f64, f64) {
    let (mut lo, mut hi) = (lo, hi);
    if !lo.is_finite() || !hi.is_finite() {
        return (0.0, 1.0, 0.25);
    }
    if (hi - lo).abs() < 1e-12 {
        let pad = if lo == 0.0 { 1.0 } else { lo.abs() * 0.1 };
        lo -= pad;
        hi += pad;
    }
    let raw = (hi - lo) / target.max(1) as f64;
    let mag = 10f64.powf(raw.log10().floor());
    let norm = raw / mag;
    let step = mag
        * if norm <= 1.0 {
            1.0
        } else if norm <= 2.0 {
            2.0
        } else if norm <= 2.5 {
            2.5
        } else if norm <= 5.0 {
            5.0
        } else {
            10.0
        };
    ((lo / step).floor() * step, (hi / step).ceil() * step, step)
}

struct Frame {
    w: f64,
    h: f64,
    left: f64,
    right: f64,
    top: f64,
    bottom: f64,
}

impl Frame {
    fn plot_w(&self) -> f64 {
        self.w - self.left - self.right
    }
    fn plot_h(&self) -> f64 {
        self.h - self.top - self.bottom
    }
}

/// Render a chart to an SVG document of `width_pt` × `height_pt`.
pub fn render(data: &ChartData, theme: &Theme, width_pt: f64, height_pt: f64) -> String {
    let mut s = String::new();
    let font = font_stack(theme);
    let w = width_pt.max(60.0);
    let h = height_pt.max(40.0);
    let _ = write!(
        s,
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2} {h:.2}" width="{w:.2}pt" height="{h:.2}pt" font-family="{font}" font-size="7">"#
    );
    let has_data = data.series.iter().any(|x| !x.points.is_empty());
    if !has_data {
        let _ = write!(
            s,
            r#"<rect x="0.5" y="0.5" width="{:.2}" height="{:.2}" fill="{}" stroke="{}" stroke-width="0.5" rx="4"/><text x="{:.2}" y="{:.2}" text-anchor="middle" fill="{}" font-size="8">No data</text></svg>"#,
            w - 1.0,
            h - 1.0,
            esc(&theme.surface_color),
            esc(&theme.border_color),
            w / 2.0,
            h / 2.0 + 3.0,
            esc(&theme.muted_color)
        );
        return s;
    }
    match data.kind {
        ChartKind::Pie => pie(&mut s, data, theme, w, h),
        ChartKind::Histogram => histogram(&mut s, data, theme, w, h),
        ChartKind::Bar => bars(&mut s, data, theme, w, h),
        ChartKind::Line | ChartKind::Scatter => xy(&mut s, data, theme, w, h),
    }
    s.push_str("</svg>");
    s
}

fn color_of(i: usize, series: &SeriesData) -> String {
    series.color.clone().filter(|c| !c.trim().is_empty()).unwrap_or_else(|| PALETTE[i % PALETTE.len()].to_string())
}

fn legend_height(data: &ChartData) -> f64 {
    if data.legend && data.series.len() > 1 {
        14.0
    } else {
        0.0
    }
}

fn draw_legend(s: &mut String, data: &ChartData, theme: &Theme, w: f64) {
    if legend_height(data) == 0.0 {
        return;
    }
    // Estimate label widths at 7 pt (average glyph ≈ 0.55 em).
    let items: Vec<(String, f64)> =
        data.series.iter().map(|x| (x.label.clone(), x.label.chars().count() as f64 * 3.9 + 16.0)).collect();
    let total: f64 = items.iter().map(|i| i.1).sum();
    let mut x = (w - total).max(0.0) / 2.0;
    for (i, (label, width)) in items.iter().enumerate() {
        let c = color_of(i, &data.series[i]);
        let _ = write!(
            s,
            r#"<rect x="{x:.2}" y="3" width="8" height="8" rx="2" fill="{}"/><text x="{:.2}" y="10" fill="{}">{}</text>"#,
            esc(&c),
            x + 11.0,
            esc(&theme.text_color),
            esc(label)
        );
        x += width;
    }
}

fn axis_labels(s: &mut String, data: &ChartData, theme: &Theme, f: &Frame) {
    if !data.x_label.is_empty() {
        let _ = write!(
            s,
            r#"<text x="{:.2}" y="{:.2}" text-anchor="middle" fill="{}">{}</text>"#,
            f.left + f.plot_w() / 2.0,
            f.h - 2.0,
            esc(&theme.muted_color),
            esc(&data.x_label)
        );
    }
    if !data.y_label.is_empty() {
        let cx = 7.0;
        let cy = f.top + f.plot_h() / 2.0;
        let _ = write!(
            s,
            r#"<text x="{cx:.2}" y="{cy:.2}" text-anchor="middle" fill="{}" transform="rotate(-90 {cx:.2} {cy:.2})">{}</text>"#,
            esc(&theme.muted_color),
            esc(&data.y_label)
        );
    }
}

fn y_axis(s: &mut String, data: &ChartData, theme: &Theme, f: &Frame, lo: f64, hi: f64, step: f64) {
    let grid = "#e8e8ed";
    let mut v = lo;
    let mut n = 0;
    while v <= hi + step * 0.5 && n < 50 {
        let y = f.top + f.plot_h() * (1.0 - (v - lo) / (hi - lo));
        if data.grid {
            let _ = write!(
                s,
                r#"<line x1="{:.2}" x2="{:.2}" y1="{y:.2}" y2="{y:.2}" stroke="{grid}" stroke-width="0.5"/>"#,
                f.left,
                f.w - f.right
            );
        }
        let _ = write!(
            s,
            r#"<text x="{:.2}" y="{:.2}" text-anchor="end" fill="{}">{}</text>"#,
            f.left - 4.0,
            y + 2.5,
            esc(&theme.muted_color),
            fmt_tick(v, step)
        );
        v += step;
        n += 1;
    }
    let _ = write!(
        s,
        r#"<line x1="{:.2}" x2="{:.2}" y1="{:.2}" y2="{:.2}" stroke="{}" stroke-width="0.6"/>"#,
        f.left,
        f.w - f.right,
        f.top + f.plot_h(),
        f.top + f.plot_h(),
        esc(&theme.border_color)
    );
}

fn limits(s: &mut String, data: &ChartData, theme: &Theme, f: &Frame, lo: f64, hi: f64) {
    for l in &data.limits {
        if l.value < lo || l.value > hi {
            continue;
        }
        let y = f.top + f.plot_h() * (1.0 - (l.value - lo) / (hi - lo));
        let c = l.color.clone().filter(|c| !c.is_empty()).unwrap_or_else(|| theme.fail_color.clone());
        let _ = write!(
            s,
            r#"<line x1="{:.2}" x2="{:.2}" y1="{y:.2}" y2="{y:.2}" stroke="{}" stroke-width="0.9" stroke-dasharray="4 2.5"/><text x="{:.2}" y="{:.2}" text-anchor="end" fill="{}" font-size="6.5">{}</text>"#,
            f.left,
            f.w - f.right,
            esc(&c),
            f.w - f.right - 2.0,
            y - 2.5,
            esc(&theme.text_color),
            esc(&l.label)
        );
    }
}

fn y_range(data: &ChartData, include_zero: bool) -> (f64, f64, f64) {
    let mut lo = f64::INFINITY;
    let mut hi = f64::NEG_INFINITY;
    for sr in &data.series {
        for (_, y) in &sr.points {
            lo = lo.min(*y);
            hi = hi.max(*y);
        }
    }
    for l in &data.limits {
        lo = lo.min(l.value);
        hi = hi.max(l.value);
    }
    if include_zero {
        lo = lo.min(0.0);
        hi = hi.max(0.0);
    }
    nice_ticks(lo, hi, 5)
}

fn left_margin(lo: f64, hi: f64, step: f64, data: &ChartData) -> f64 {
    let widest = [lo, hi].iter().map(|v| fmt_tick(*v, step).chars().count()).max().unwrap_or(1) as f64;
    widest * 4.0 + 8.0 + if data.y_label.is_empty() { 0.0 } else { 10.0 }
}

fn frame(data: &ChartData, w: f64, h: f64, left: f64) -> Frame {
    Frame {
        w,
        h,
        left,
        right: 6.0,
        top: 6.0 + legend_height(data),
        bottom: 14.0 + if data.x_label.is_empty() { 0.0 } else { 10.0 },
    }
}

fn xy(s: &mut String, data: &ChartData, theme: &Theme, w: f64, h: f64) {
    let (lo, hi, step) = y_range(data, false);
    let f = frame(data, w, h, left_margin(lo, hi, step, data));
    draw_legend(s, data, theme, w);
    y_axis(s, data, theme, &f, lo, hi, step);

    let numeric = data.series.iter().all(|sr| sr.points.iter().all(|(x, _)| matches!(x, XVal::Num(_))));
    let (xlo, xhi, xstep, cats) = if numeric {
        let mut a = f64::INFINITY;
        let mut b = f64::NEG_INFINITY;
        for sr in &data.series {
            for (x, _) in &sr.points {
                if let XVal::Num(v) = x {
                    a = a.min(*v);
                    b = b.max(*v);
                }
            }
        }
        let (a2, b2, st) = nice_ticks(a, b, 6);
        // Keep integer index axes tight (0..n-1) rather than padded.
        if a.fract() == 0.0 && b.fract() == 0.0 && (b - a) <= 12.0 {
            (a, b.max(a + 1.0), 1.0, vec![])
        } else {
            (a2, b2, st, vec![])
        }
    } else {
        let mut cats: Vec<String> = Vec::new();
        for sr in &data.series {
            for (x, _) in &sr.points {
                let label = match x {
                    XVal::Cat(c) => c.clone(),
                    XVal::Num(n) => fmt_tick(*n, 0.001),
                };
                if !cats.contains(&label) {
                    cats.push(label);
                }
            }
        }
        (0.0, (cats.len().max(2) - 1) as f64, 1.0, cats)
    };
    let px = |x: f64| f.left + f.plot_w() * (x - xlo) / (xhi - xlo);
    let py = |y: f64| f.top + f.plot_h() * (1.0 - (y - lo) / (hi - lo));

    // X tick labels (thinned to avoid collisions).
    let base = f.top + f.plot_h();
    let ticks: Vec<(f64, String)> = if cats.is_empty() {
        let mut t = Vec::new();
        let mut v = xlo;
        while v <= xhi + xstep * 0.5 && t.len() < 60 {
            t.push((v, fmt_tick(v, xstep)));
            v += xstep;
        }
        t
    } else {
        cats.iter().enumerate().map(|(i, c)| (i as f64, c.clone())).collect()
    };
    let max_label = ticks.iter().map(|t| t.1.chars().count()).max().unwrap_or(1) as f64 * 4.0 + 6.0;
    let every = ((ticks.len() as f64 * max_label / f.plot_w()).ceil() as usize).max(1);
    for (i, (v, label)) in ticks.iter().enumerate() {
        if i % every != 0 {
            continue;
        }
        let _ = write!(
            s,
            r#"<text x="{:.2}" y="{:.2}" text-anchor="middle" fill="{}">{}</text>"#,
            px(*v),
            base + 10.0,
            esc(&theme.muted_color),
            esc(label)
        );
    }
    limits(s, data, theme, &f, lo, hi);

    let xnum = |x: &XVal| -> f64 {
        match x {
            XVal::Num(n) => *n,
            XVal::Cat(c) => cats.iter().position(|k| k == c).unwrap_or(0) as f64,
        }
    };
    for (i, sr) in data.series.iter().enumerate() {
        let c = color_of(i, sr);
        if data.kind == ChartKind::Line && sr.points.len() > 1 {
            let mut d = String::new();
            for (k, (x, y)) in sr.points.iter().enumerate() {
                let _ = write!(d, "{}{:.2},{:.2}", if k == 0 { "M" } else { " L" }, px(xnum(x)), py(*y));
            }
            let _ = write!(
                s,
                r#"<path d="{d}" fill="none" stroke="{}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>"#,
                esc(&c)
            );
        }
        let show_markers = data.kind == ChartKind::Scatter || sr.points.len() <= 24;
        if show_markers {
            let r = if data.kind == ChartKind::Scatter { 2.4 } else { 2.0 };
            for (x, y) in &sr.points {
                let _ = write!(
                    s,
                    r##"<circle cx="{:.2}" cy="{:.2}" r="{r}" fill="{}" stroke="#ffffff" stroke-width="0.8"/>"##,
                    px(xnum(x)),
                    py(*y),
                    esc(&c)
                );
            }
        }
    }
    axis_labels(s, data, theme, &f);
}

fn bars(s: &mut String, data: &ChartData, theme: &Theme, w: f64, h: f64) {
    let (lo, hi, step) = y_range(data, true);
    let f = frame(data, w, h, left_margin(lo, hi, step, data));
    draw_legend(s, data, theme, w);
    y_axis(s, data, theme, &f, lo, hi, step);

    let mut cats: Vec<String> = Vec::new();
    for sr in &data.series {
        for (x, _) in &sr.points {
            let label = match x {
                XVal::Cat(c) => c.clone(),
                XVal::Num(n) => fmt_tick(*n, 0.001),
            };
            if !cats.contains(&label) {
                cats.push(label);
            }
        }
    }
    let n = cats.len().max(1) as f64;
    let band = f.plot_w() / n;
    let ns = data.series.len().max(1) as f64;
    let group = band * 0.72;
    let bar_w = ((group - (ns - 1.0) * 1.5) / ns).clamp(1.0, 18.0);
    let group_w = bar_w * ns + (ns - 1.0) * 1.5;
    let py = |y: f64| f.top + f.plot_h() * (1.0 - (y - lo) / (hi - lo));
    let zero = py(0.0);

    for (ci, cat) in cats.iter().enumerate() {
        let cx = f.left + band * (ci as f64 + 0.5);
        for (si, sr) in data.series.iter().enumerate() {
            let Some((_, y)) = sr.points.iter().find(|(x, _)| match x {
                XVal::Cat(c) => c == cat,
                XVal::Num(v) => &fmt_tick(*v, 0.001) == cat,
            }) else {
                continue;
            };
            let x = cx - group_w / 2.0 + si as f64 * (bar_w + 1.5);
            let top = py(*y);
            let (y0, y1) = if top < zero { (top, zero) } else { (zero, top) };
            let hgt = (y1 - y0).max(0.3);
            let r = (bar_w / 2.0).min(2.0).min(hgt);
            // Rounded data end, square at the baseline.
            let path = if *y >= 0.0 {
                format!(
                    "M{x:.2},{y1:.2} V{:.2} Q{x:.2},{y0:.2} {:.2},{y0:.2} H{:.2} Q{:.2},{y0:.2} {:.2},{:.2} V{y1:.2} Z",
                    y0 + r,
                    x + r,
                    x + bar_w - r,
                    x + bar_w,
                    x + bar_w,
                    y0 + r
                )
            } else {
                format!(
                    "M{x:.2},{y0:.2} V{:.2} Q{x:.2},{y1:.2} {:.2},{y1:.2} H{:.2} Q{:.2},{y1:.2} {:.2},{:.2} V{y0:.2} Z",
                    y1 - r,
                    x + r,
                    x + bar_w - r,
                    x + bar_w,
                    x + bar_w,
                    y1 - r
                )
            };
            let _ = write!(s, r#"<path d="{path}" fill="{}"/>"#, esc(&color_of(si, sr)));
        }
    }
    let max_label = cats.iter().map(|c| c.chars().count()).max().unwrap_or(1) as f64 * 4.0 + 6.0;
    let every = ((n * max_label / f.plot_w()).ceil() as usize).max(1);
    for (ci, cat) in cats.iter().enumerate() {
        if ci % every != 0 {
            continue;
        }
        let _ = write!(
            s,
            r#"<text x="{:.2}" y="{:.2}" text-anchor="middle" fill="{}">{}</text>"#,
            f.left + band * (ci as f64 + 0.5),
            f.top + f.plot_h() + 10.0,
            esc(&theme.muted_color),
            esc(cat)
        );
    }
    limits(s, data, theme, &f, lo, hi);
    axis_labels(s, data, theme, &f);
}

fn histogram(s: &mut String, data: &ChartData, theme: &Theme, w: f64, h: f64) {
    let values: Vec<f64> = data.series.first().map(|sr| sr.points.iter().map(|p| p.1).collect()).unwrap_or_default();
    let mut lo = values.iter().cloned().fold(f64::INFINITY, f64::min);
    let mut hi = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    for l in &data.limits {
        lo = lo.min(l.value);
        hi = hi.max(l.value);
    }
    if (hi - lo).abs() < 1e-12 {
        lo -= 0.5;
        hi += 0.5;
    }
    // Snap bins to round boundaries so edge labels read cleanly.
    let (nlo, nhi, width) = nice_ticks(lo, hi, data.bins.clamp(2, 200) as usize);
    let (lo, hi) = (nlo, nhi);
    let bins = (((hi - lo) / width).round() as usize).clamp(1, 400);
    let mut counts = vec![0usize; bins];
    for v in &values {
        let mut i = ((v - lo) / width).floor() as isize;
        if i as usize >= bins {
            i = bins as isize - 1;
        }
        if i >= 0 {
            counts[i as usize] += 1;
        }
    }
    let maxc = *counts.iter().max().unwrap_or(&1) as f64;
    let (ylo, _, ystep) = nice_ticks(0.0, maxc.max(1.0), 4);
    // Counts are integers: use an integer step and re-derive the top.
    let ystep = ystep.ceil().max(1.0);
    let yhi = (maxc.max(1.0) / ystep).ceil() * ystep;
    let f = frame(data, w, h, left_margin(ylo, yhi, ystep, data));
    y_axis(s, data, theme, &f, ylo, yhi, ystep);
    let color = data.series.first().map(|sr| color_of(0, sr)).unwrap_or_else(|| PALETTE[0].into());
    let bw = f.plot_w() / bins as f64;
    for (i, c) in counts.iter().enumerate() {
        if *c == 0 {
            continue;
        }
        let hgt = f.plot_h() * (*c as f64 - ylo) / (yhi - ylo);
        let x = f.left + i as f64 * bw + 0.75;
        let y = f.top + f.plot_h() - hgt;
        let _ = write!(
            s,
            r#"<rect x="{x:.2}" y="{y:.2}" width="{:.2}" height="{hgt:.2}" fill="{}" rx="1"/>"#,
            (bw - 1.5).max(0.5),
            esc(&color)
        );
    }
    // x ticks at bin edges (thinned)
    let every = ((bins as f64 * 26.0 / f.plot_w()).ceil() as usize).max(1);
    for i in (0..=bins).step_by(every) {
        let v = lo + i as f64 * width;
        let _ = write!(
            s,
            r#"<text x="{:.2}" y="{:.2}" text-anchor="middle" fill="{}">{}</text>"#,
            f.left + i as f64 * bw,
            f.top + f.plot_h() + 10.0,
            esc(&theme.muted_color),
            fmt_tick(v, width)
        );
    }
    // Vertical limit lines on the value axis.
    for l in &data.limits {
        let x = f.left + f.plot_w() * (l.value - lo) / (hi - lo);
        let c = l.color.clone().filter(|c| !c.is_empty()).unwrap_or_else(|| theme.fail_color.clone());
        // Keep the label inside the plot: flip to the left near the right edge.
        let flip = x + 2.0 + l.label.chars().count() as f64 * 3.6 > f.w - f.right;
        let _ = write!(
            s,
            r#"<line x1="{x:.2}" x2="{x:.2}" y1="{:.2}" y2="{:.2}" stroke="{}" stroke-width="0.9" stroke-dasharray="4 2.5"/><text x="{:.2}" y="{:.2}" fill="{}" font-size="6.5" text-anchor="{}">{}</text>"#,
            f.top,
            f.top + f.plot_h(),
            esc(&c),
            if flip { x - 2.0 } else { x + 2.0 },
            f.top + 7.0,
            esc(&theme.text_color),
            if flip { "end" } else { "start" },
            esc(&l.label)
        );
    }
    axis_labels(s, data, theme, &f);
}

fn pie(s: &mut String, data: &ChartData, theme: &Theme, w: f64, h: f64) {
    let Some(sr) = data.series.first() else { return };
    let items: Vec<(String, f64)> = sr
        .points
        .iter()
        .filter(|(_, v)| *v > 0.0)
        .map(|(x, v)| {
            (
                match x {
                    XVal::Cat(c) => c.clone(),
                    XVal::Num(n) => fmt_tick(*n, 0.001),
                },
                *v,
            )
        })
        .collect();
    let total: f64 = items.iter().map(|i| i.1).sum();
    if total <= 0.0 {
        return;
    }
    let r = (h / 2.0 - 6.0).min(w / 4.0).max(10.0);
    let (cx, cy) = (r + 8.0, h / 2.0);
    let inner = r * 0.58;
    let mut angle = -std::f64::consts::FRAC_PI_2;
    for (i, (_, v)) in items.iter().enumerate() {
        let sweep = v / total * std::f64::consts::TAU;
        let c = PALETTE[i % PALETTE.len()];
        if items.len() == 1 {
            let _ = write!(
                s,
                r#"<circle cx="{cx:.2}" cy="{cy:.2}" r="{:.2}" fill="none" stroke="{c}" stroke-width="{:.2}"/>"#,
                (r + inner) / 2.0,
                r - inner
            );
        } else {
            let a0 = angle;
            let a1 = angle + sweep;
            let large = if sweep > std::f64::consts::PI { 1 } else { 0 };
            let (x0, y0) = (cx + r * a0.cos(), cy + r * a0.sin());
            let (x1, y1) = (cx + r * a1.cos(), cy + r * a1.sin());
            let (x2, y2) = (cx + inner * a1.cos(), cy + inner * a1.sin());
            let (x3, y3) = (cx + inner * a0.cos(), cy + inner * a0.sin());
            let _ = write!(
                s,
                r##"<path d="M{x0:.2},{y0:.2} A{r:.2},{r:.2} 0 {large} 1 {x1:.2},{y1:.2} L{x2:.2},{y2:.2} A{inner:.2},{inner:.2} 0 {large} 0 {x3:.2},{y3:.2} Z" fill="{c}" stroke="#ffffff" stroke-width="1.2"/>"##
            );
        }
        angle += sweep;
    }
    // Legend with values and shares — identity never by colour alone.
    let lx = cx + r + 16.0;
    let line = 11.0;
    let start = cy - (items.len() as f64 * line) / 2.0 + 8.0;
    for (i, (label, v)) in items.iter().enumerate() {
        let y = start + i as f64 * line;
        let _ = write!(
            s,
            r#"<rect x="{lx:.2}" y="{:.2}" width="7" height="7" rx="2" fill="{}"/><text x="{:.2}" y="{y:.2}" fill="{}">{} — {} ({:.1} %)</text>"#,
            y - 6.5,
            PALETTE[i % PALETTE.len()],
            lx + 11.0,
            esc(&theme.text_color),
            esc(label),
            crate::expr::format_number(*v),
            v / total * 100.0
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn series(points: Vec<(XVal, f64)>) -> SeriesData {
        SeriesData { label: "s".into(), points, color: None }
    }

    #[test]
    fn ticks_are_nice() {
        assert_eq!(nice_ticks(0.0, 9.3, 5), (0.0, 10.0, 2.0));
        let (lo, hi, st) = nice_ticks(4.87, 5.13, 5);
        assert!(lo <= 4.87 && hi >= 5.13 && st > 0.0);
    }

    #[test]
    fn renders_each_kind() {
        for kind in [ChartKind::Line, ChartKind::Bar, ChartKind::Scatter, ChartKind::Histogram, ChartKind::Pie] {
            let d = ChartData {
                kind,
                series: vec![series(vec![(XVal::Num(0.0), 1.0), (XVal::Num(1.0), 3.0), (XVal::Num(2.0), 2.0)])],
                limits: vec![LimitData { label: "USL".into(), value: 3.5, color: None }],
                x_label: "x".into(),
                y_label: "y <&>".into(),
                bins: 5,
                legend: true,
                grid: true,
            };
            let svg = render(&d, &Theme::default(), 400.0, 150.0);
            assert!(svg.starts_with("<svg") && svg.ends_with("</svg>"));
            if kind != ChartKind::Pie {
                assert!(svg.contains("y &lt;&amp;&gt;"));
            }
        }
    }

    #[test]
    fn empty_chart_placeholder() {
        let d = ChartData {
            kind: ChartKind::Line,
            series: vec![],
            limits: vec![],
            x_label: String::new(),
            y_label: String::new(),
            bins: 10,
            legend: false,
            grid: true,
        };
        assert!(render(&d, &Theme::default(), 200.0, 100.0).contains("No data"));
    }
}
