use std::process::Command;

fn main() {
    // Stamp the bundled lessons' content version from git, the same way the
    // lesson pack workflow does (tools/content-version.sh), so an app and a
    // pack built from the same lessons report the same version.
    println!("cargo:rerun-if-changed=../lessons");
    println!("cargo:rerun-if-changed=../.git/HEAD");
    println!("cargo:rerun-if-changed=../.git/refs/heads");
    let git = |args: &[&str]| {
        Command::new("git")
            .args(args)
            .env("TZ", "UTC")
            .current_dir("..")
            .output()
            .ok()
            .filter(|o| o.status.success())
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .filter(|s| !s.is_empty())
    };
    let date = git(&[
        "log",
        "-1",
        "--date=format-local:%Y.%m.%d",
        "--format=%cd",
        "--",
        "lessons",
    ]);
    let count = git(&["rev-list", "--count", "HEAD", "--", "lessons"]);
    let version = match (date, count) {
        (Some(d), Some(n)) => format!("{d}.{n}"),
        _ => String::new(), // no git: keep the manifest's value
    };
    println!("cargo:rustc-env=CANOPY_CONTENT_VERSION={version}");
    tauri_build::build()
}
