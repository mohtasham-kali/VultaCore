use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Debug, Serialize, Deserialize)]
struct AnalyticsRequest {
    user_id: String,
    actions: Vec<UserAction>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct UserAction {
    action_type: String,
    timestamp: u64,
    points: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnalyticsResponse {
    user_id: String,
    total_points: i32,
    rank_estimate: String,
    engagement_score: f32,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(health_check))
        .route("/calculate", post(calculate_analytics))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 5000));
    println!("Rust Analytics Engine listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "Rust Analytics Engine Online"
}

async fn calculate_analytics(Json(payload): Json<AnalyticsRequest>) -> Json<AnalyticsResponse> {
    let total_points: i32 = payload.actions.iter().map(|a| a.points).sum();
    
    let rank_estimate = match total_points {
        0..=100 => "Bronze",
        101..=500 => "Silver",
        501..=1000 => "Gold",
        _ => "Platinum",
    };

    let engagement_score = (payload.actions.len() as f32 * 1.5).min(100.0);

    Json(AnalyticsResponse {
        user_id: payload.user_id,
        total_points,
        rank_estimate: rank_estimate.to_string(),
        engagement_score,
    })
}
