fn main() {
    // Register the single-instance plugin so its permissions are compiled into the ACL
    let attrs = tauri_build::Attributes::new()
        .plugin("single-instance", tauri_build::InlinedPlugin::default());

    // Run the Tauri build helper with the configured attributes
    tauri_build::try_build(attrs)
        .expect("error while running tauri build");
}
