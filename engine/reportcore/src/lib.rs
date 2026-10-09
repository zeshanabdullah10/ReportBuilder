//! Report Builder engine.
//!
//! Turns a template ([`model::Document`]) plus JSON data into a paginated
//! PDF (or SVG pages for preview) using an embedded Typst typesetter.
//! No browser, no network, deterministic output.

pub mod api;
pub mod charts;
pub mod codes;
pub mod datetime;
pub mod encoding;
pub mod expr;
pub mod gallery;
pub mod import;
pub mod migrate;
pub mod model;
pub mod render;
pub mod typst_gen;
pub mod validate;

pub use model::Document;
pub use render::{compile, render_pdf, BlockRegion, Compiled, PdfStandard, RenderError, RenderOptions};
pub use validate::{validate, Issue, Severity};
