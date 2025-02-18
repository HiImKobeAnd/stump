use axum::Router;

use crate::config::state::AppState;

mod api;
mod koreader;
mod opds;
mod spa;
mod sse;
mod utoipa;
#[allow(dead_code)]
mod ws;

pub(crate) use api::v1::auth::enforce_max_sessions;
pub(crate) use spa::relative_favicon_path;

pub(crate) fn mount(app_state: AppState) -> Router<AppState> {
	let mut app_router = Router::new();

	if app_state.config.enable_swagger || app_state.config.is_debug() {
		app_router = app_router.merge(utoipa::mount(app_state.clone()));
	}

	if app_state.config.enable_koreader_sync {
		app_router = app_router.merge(koreader::mount(app_state.clone()));
	}

	app_router
		.merge(spa::mount(app_state.clone()))
		.merge(sse::mount())
		.merge(api::mount(app_state.clone()))
		.merge(opds::mount(app_state))
}
