mod commands;
mod content;
mod db;
mod editor;
mod session;
mod updates;

use std::sync::{Arc, Mutex, RwLock};

use canopy_core::catalog::Catalog;
use canopy_core::env::AppPaths;
use tauri::Manager;

pub struct AppState {
    pub paths: AppPaths,
    pub catalog: RwLock<Arc<Catalog>>,
    pub db: Arc<Mutex<db::Db>>,
    pub session: Mutex<Option<session::Session>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data = app.path().app_data_dir()?;
            let paths = AppPaths::new(&data);
            paths.ensure()?;
            let db = db::Db::open(&data.join("canopy.db"))?;
            let catalog = content::load_catalog(app.handle(), &paths)?;
            editor::spawn_watcher(app.handle().clone(), paths.editor_requests());
            app.manage(AppState {
                paths,
                catalog: RwLock::new(Arc::new(catalog)),
                db: Arc::new(Mutex::new(db)),
                session: Mutex::new(None),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::git_check,
            commands::get_catalog,
            commands::get_lesson,
            commands::start_lesson,
            commands::stop_lesson,
            commands::terminal_write,
            commands::terminal_resize,
            commands::submit_answer,
            commands::run_action,
            commands::list_dir,
            commands::read_file,
            commands::write_file,
            commands::editor_finish,
            commands::get_settings,
            commands::set_setting,
            commands::reset_progress,
            commands::tool_check,
            commands::repo_diff,
            commands::three_areas,
            commands::git_object,
            commands::skip_lesson,
            commands::check_updates,
            commands::install_update,
            commands::frontend_log,
            commands::smoke_lesson,
            commands::terminal_go_home,
            commands::learning_folder,
            commands::terminal_busy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Canopy");
}
