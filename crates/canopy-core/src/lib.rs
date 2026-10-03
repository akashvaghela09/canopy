//! Canopy core: everything about lessons and repos that does not need a UI.
//! Shared by the Tauri app and the `canopy-lesson` CLI.

pub mod catalog;
pub mod check;
pub mod env;
pub mod git;
pub mod goal;
pub mod harness;
pub mod marker;
pub mod runner;
pub mod snapshot;
pub mod validate;
