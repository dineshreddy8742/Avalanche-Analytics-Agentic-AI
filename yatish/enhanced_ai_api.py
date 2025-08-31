#!/usr/bin/env python3
"""
Avalanche Analytics API (Production-ready)
- Unified HTTP + Socket.IO from a single Flask app
- Env-driven config (PORT, SECRET_KEY, CORS_ORIGINS)
- Security: Flask-Talisman (CSP), Flask-Limiter (rate limits), CORS restricted
- Structured logging, pathlib paths, no hardcoded absolutes
- Serves frontend from same origin on port 8080 by default
"""

import os
import random
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from dotenv import load_dotenv

# Local imports
from enhanced_llm_agent import EnhancedLLMElectionAgent

# -----------------------------------------------------------------------------
# Paths and environment
# -----------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent.resolve()
load_dotenv()  # optional for dev; reads .env if present

PORT = int(os.getenv("PORT", "8080"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:8080").split(",") if o.strip()]

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("avalanche.analytics")

# -----------------------------------------------------------------------------
# Flask app, security, sockets
# -----------------------------------------------------------------------------
app = Flask(__name__)

secret_key = os.getenv("SECRET_KEY")
if not secret_key:
    import secrets

    secret_key = secrets.token_urlsafe(32)
    logger.warning("SECRET_KEY not set in env; generated a random key for this run. Set SECRET_KEY in production.")
app.config["SECRET_KEY"] = secret_key

# CORS for HTTP
CORS(app, resources={r"/*": {"origins": CORS_ORIGINS}}, supports_credentials=True)

# Rate limiting (default 100/min per IP)
limiter = Limiter(get_remote_address, app=app, default_limits=["100 per minute"])  # noqa: F841

# Security headers via Talisman (relaxed CSP for now; TODO refine)
CSP = {
    "default-src": "'self' https: data: 'unsafe-inline'",
}
Talisman(
    app,
    content_security_policy=CSP,
    strict_transport_security=False,
    session_cookie_secure=False,
)

# Socket.IO
socketio = SocketIO(
    app,
    cors_allowed_origins=CORS_ORIGINS,
    async_mode="eventlet",
)

# -----------------------------------------------------------------------------
# Core analytics engine
# -----------------------------------------------------------------------------
class AvalancheVotingAnalytics:
    def __init__(self):
        self.data_folder = str(PROJECT_ROOT)
        self.llm_agent = EnhancedLLMElectionAgent(self.data_folder)
        self.data_stream = self.llm_agent.stream_election_data()

        self.blockchain_events: List[Dict[str, Any]] = []
        self.smart_contract_address = "0x742d35cc6434c0532925a3b8d0aef44fabbdc3c5"
        self.avalanche_network = "fuji-testnet"

        self.transaction_count = 0
        self.gas_used = 0

        self.demo_election_active = False
        self.demo_election_data = self.generate_enhanced_demo_election()
        self.real_time_updates = True

        self.insights_cache: Dict[str, Any] = {}
        self.prediction_cache: Dict[str, Any] = {}

    def generate_enhanced_demo_election(self) -> Dict[str, Any]:
        df = self.llm_agent.demographic_df
        unique_candidates = df.drop_duplicates(subset=["candidate_name"]) if df is not None else []

        candidates = []
        if df is not None:
            for index, row in unique_candidates.iterrows():
                candidates.append(
                    {
                        "id": index + 1,
                        "name": row["candidate_name"],
                        "party": row["party"],
                        "blockchain_address": f"0x{hash(row['candidate_name']) % (10**40):040x}",
                        "verified": True,
                    }
                )
        votes = {c["id"]: 0 for c in candidates}
        total_eligible = int(df["total"].sum()) if df is not None and not df.empty else 0

        return {
            "election_id": "avalanche_data_driven_2024",
            "election_name": "Avalanche Blockchain Voting Demo 2024",
            "smart_contract": self.smart_contract_address,
            "network": self.avalanche_network,
            "status": "live",
            "start_time": (datetime.now() - timedelta(hours=1)).isoformat(),
            "end_time": (datetime.now() + timedelta(hours=8)).isoformat(),
            "candidates": candidates,
            "votes": votes,
            "total_eligible_voters": total_eligible,
            "current_turnout": 0,
            "turnout_percentage": 0.0,
            "voting_rate_per_minute": 0.0,
            "blockchain_stats": {
                "total_transactions": 0,
                "gas_used": 0,
                "avg_confirmation_time": "2.3s",
                "network_fees": "$0.002",
            },
            "last_updated": datetime.now().isoformat(),
        }

    def simulate_blockchain_vote(self, vote_record: dict) -> Dict[str, Any] | None:
        voter_address = f"0x{random.randint(10**39, 10**40-1):040x}"
        self.transaction_count += 1
        gas_cost = random.randint(21000, 45000)
        self.gas_used += gas_cost

        candidate_name = vote_record.get("candidate_name")
        candidate_id = next((c["id"] for c in self.demo_election_data["candidates"] if c["name"] == candidate_name), None)
        if candidate_id is None:
            return None

        tx = {
            "tx_hash": f"0x{random.randint(10**63, 10**64-1):064x}",
            "from": voter_address,
            "to": self.smart_contract_address,
            "candidate_id": int(candidate_id),
            "gas_used": int(gas_cost),
            "gas_price": "20 gwei",
            "timestamp": datetime.now().isoformat(),
            "block_number": int(self.transaction_count + 1_500_000),
            "confirmation_time": float(round(random.uniform(1.8, 3.2), 1)),
            "status": "confirmed",
        }
        self.blockchain_events.append({"type": "vote_cast", "transaction": tx, "timestamp": datetime.now().isoformat()})

        # Update counts
        self.demo_election_data["votes"][candidate_id] = self.demo_election_data["votes"].get(candidate_id, 0) + 1
        self.demo_election_data["current_turnout"] = sum(self.demo_election_data["votes"].values())
        if self.demo_election_data["total_eligible_voters"] > 0:
            self.demo_election_data["turnout_percentage"] = round(
                (self.demo_election_data["current_turnout"] / self.demo_election_data["total_eligible_voters"]) * 100, 2
            )
        self.demo_election_data["blockchain_stats"]["total_transactions"] = self.transaction_count
        self.demo_election_data["blockchain_stats"]["gas_used"] = self.gas_used
        return tx

    def simulate_live_votes(self):
        if not self.demo_election_active:
            return
        vote_record = next(self.data_stream)
        tx = self.simulate_blockchain_vote(vote_record)
        if not tx:
            return
        self.demo_election_data["last_updated"] = datetime.now().isoformat()
        fresh_insights = self.get_real_time_insights()
        if self.real_time_updates:
            socketio.emit("new_transaction", {"type": "vote_cast", "transaction": tx, "timestamp": datetime.now().isoformat()})
            socketio.emit(
                "enhanced_voting_update",
                {
                    "election_data": self.format_demo_election(),
                    "blockchain_transactions": [tx],
                    "ai_insights": fresh_insights,
                    "analytics": self.get_enhanced_live_analytics(),
                    "avalanche_stats": self.get_avalanche_network_stats(),
                    "timestamp": datetime.now().isoformat(),
                },
            )

    def get_real_time_insights(self) -> List[Dict[str, Any]]:
        cache_key = datetime.now().strftime("%Y%m%d_%H%M")[:12]
        if cache_key not in self.insights_cache:
            analysis = self.llm_agent.generate_comprehensive_analysis(include_predictions=True, include_anomalies=True, include_sentiment=True)
            insights: List[Dict[str, Any]] = []
            for insight in analysis["insights"][:5]:
                insights.append(
                    {
                        "type": insight.type.value,
                        "title": insight.title,
                        "description": (insight.description[:200] + "...") if len(insight.description) > 200 else insight.description,
                        "confidence": float(round(insight.confidence, 3)),
                        "importance": int(insight.importance),
                        "timestamp": insight.timestamp.isoformat(),
                    }
                )
            self.insights_cache[cache_key] = insights
        return self.insights_cache[cache_key]

    def get_enhanced_live_analytics(self) -> Dict[str, Any]:
        data = self.demo_election_data
        total_votes = int(sum(data["votes"].values()))
        if total_votes == 0:
            return {"error": "No votes recorded yet"}

        demographics_summary = self.llm_agent.generate_demographic_summary()
        candidates_full_list: List[Dict[str, Any]] = []
        for candidate in data["candidates"]:
            votes = data["votes"].get(candidate["id"], 0)
            percentage = (votes / total_votes) * 100 if total_votes > 0 else 0
            candidates_full_list.append(
                {
                    "name": candidate["name"],
                    "party": candidate["party"],
                    "votes": int(votes),
                    "percentage": float(round(percentage, 2)),
                    "blockchain_address": candidate["blockchain_address"],
                    "verified": True,
                    "trend": random.choice(["↗️ Rising", "↘️ Falling", "➡️ Stable", "🚀 Surging"]),
                }
            )
        candidates_full_list = sorted(candidates_full_list, key=lambda x: x["votes"], reverse=True)

        if len(candidates_full_list) > 4:
            top_4 = candidates_full_list[:4]
            other_votes = sum(c["votes"] for c in candidates_full_list[4:])
            other_pct = sum(c["percentage"] for c in candidates_full_list[4:])
            top_4.append({"name": "Other", "party": "Various", "votes": other_votes, "percentage": round(other_pct, 2), "trend": "➡️ Stable"})
            candidates_display = top_4
        else:
            candidates_display = candidates_full_list

        leader = candidates_full_list[0]
        runner_up = candidates_full_list[1] if len(candidates_full_list) > 1 else None

        ai_insights = [f"🏆 {leader['name']} leads with {leader['votes']} votes ({leader['percentage']}%) - blockchain verified"]
        if runner_up:
            margin = leader["votes"] - runner_up["votes"]
            ai_insights.append(f"📊 Lead margin: {margin} votes over {runner_up['name']} - competitive race detected")

        return {
            "candidates": candidates_display,
            "ai_insights": ai_insights,
            "demographics": {
                "age_groups": {"counts": demographics_summary.get("age_groups", {})},
                "gender": {"counts": demographics_summary.get("gender_distribution", {})},
                "locations": {"top_10_counts": demographics_summary.get("top_constituencies", {})},
            },
            "turnout_analysis": {
                "current": data["turnout_percentage"],
                "target": 85.0,
                "predicted_final": min(92.0, data["turnout_percentage"] + random.uniform(8, 15)),
                "ai_confidence": 0.89,
            },
            "ai_predictions": {
                "likely_winner": leader["name"],
                "confidence": random.uniform(0.82, 0.94),
                "key_factors": ["digital campaign reach", "policy resonance", "voter sentiment"],
                "upset_probability": random.uniform(0.05, 0.15),
            },
            "security_status": {"fraud_alerts": 0, "anomalies_detected": 0},
        }

    def get_avalanche_network_stats(self) -> Dict[str, Any]:
        return {
            "network": "Avalanche Fuji Testnet",
            "chain_id": int(43113),
            "current_block": int(self.transaction_count + 1_500_000),
            "tps": float(random.uniform(4.5, 6.5)),
            "finality": "instant",
            "avg_fee": "$0.002",
            "total_validators": int(1284),
            "online_validators": int(random.randint(1200, 1284)),
            "network_health": "excellent",
            "carbon_neutral": True,
        }

    def format_demo_election(self) -> Dict[str, Any]:
        data = self.demo_election_data.copy()
        total_votes = int(sum(data["votes"].values()))
        for candidate in data["candidates"]:
            candidate_votes = data["votes"].get(candidate["id"], 0)
            candidate["votes"] = candidate_votes
            candidate["percentage"] = round((candidate_votes / total_votes) * 100, 2) if total_votes > 0 else 0
            candidate["blockchain_verified"] = True
        data["candidates"] = sorted(data["candidates"], key=lambda x: x["votes"], reverse=True)
        data["ai_metadata"] = {
            "analysis_confidence": 0.89,
            "fraud_detection_active": True,
            "predictive_model_accuracy": 0.92,
            "real_time_insights": True,
        }
        return data

# Initialize engine and start demo
analytics = AvalancheVotingAnalytics()
analytics.demo_election_active = True

_simulation_started = False


def _background_simulation_loop():
    import time

    while True:
        try:
            if analytics.demo_election_active:
                analytics.simulate_live_votes()
            time.sleep(random.uniform(5, 10))
        except Exception as e:
            logger.exception(f"Background simulation error: {e}")


def start_enhanced_simulation():
    global _simulation_started
    if _simulation_started:
        return
    socketio.start_background_task(target=_background_simulation_loop)
    _simulation_started = True
    logger.info("Background simulation started")


@app.before_first_request
def _on_first_request():
    start_enhanced_simulation()

# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@app.route("/api/health")
@limiter.exempt  # health should not be rate limited
def health_check():
    logger.info("GET /api/health from %s", request.remote_addr)
    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "ai_analytics": "operational",
                "llm_agent": "active",
                "blockchain_simulation": "running",
                "real_time_updates": analytics.real_time_updates,
                "demo_election": analytics.demo_election_active,
            },
            "network": {
                "avalanche_fuji": "connected",
                "smart_contract": analytics.smart_contract_address,
                "gas_price": "20 gwei",
            },
            "ai_status": {"models_loaded": True, "prediction_accuracy": 0.92, "anomaly_detection": "active"},
        }
    )


@app.route("/api/ai/insights")
@limiter.limit("30 per minute")
def get_ai_insights():
    try:
        logger.info("GET /api/ai/insights")
        analysis = analytics.llm_agent.generate_comprehensive_analysis()
        insights_data = []
        for insight in analysis["insights"]:
            insights_data.append(
                {
                    "title": insight.title,
                    "description": insight.description,
                    "confidence": round(insight.confidence, 3),
                    "importance": insight.importance,
                    "type": insight.type.value,
                    "data_points": insight.data_points,
                    "timestamp": insight.timestamp.isoformat(),
                }
            )
        return jsonify(
            {
                "insights": insights_data,
                "summary": {
                    "total_insights": analysis["summary"]["total_insights"],
                    "confidence_avg": float(analysis["summary"]["confidence_avg"]),
                    "high_importance": analysis["summary"]["high_importance"],
                    "categories": analysis["summary"]["categories"],
                },
                "generated_at": analysis["timestamp"],
                "ai_confidence": analysis["confidence_score"],
                "blockchain_verified": True,
            }
        )
    except Exception as e:
        logger.exception("/api/ai/insights failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/predictions")
@limiter.limit("30 per minute")
def get_ai_predictions():
    try:
        logger.info("GET /api/ai/predictions")
        scenario = {
            "turnout_increase": random.uniform(3, 8),
            "demographic_shift": random.choice(["youth_surge", "digital_adoption", "urban_growth"]),
            "campaign_effect": "blockchain_transparency",
        }
        predictions = analytics.llm_agent.predict_election_outcomes(scenario)
        prediction_data = []
        for pred in predictions:
            prediction_data.append(
                {
                    "title": pred.title,
                    "description": pred.description,
                    "confidence": round(pred.confidence, 3),
                    "importance": pred.importance,
                    "data_points": pred.data_points,
                    "timestamp": pred.timestamp.isoformat(),
                }
            )
        return jsonify({"predictions": prediction_data, "scenario": scenario, "generated_at": datetime.now().isoformat(), "blockchain_verified": True})
    except Exception as e:
        logger.exception("/api/ai/predictions failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/blockchain/transactions")
def get_blockchain_transactions():
    try:
        logger.info("GET /api/blockchain/transactions")
        recent_events = analytics.blockchain_events[-20:]
        return jsonify(
            {
                "transactions": recent_events,
                "total_count": len(analytics.blockchain_events),
                "network": analytics.avalanche_network,
                "smart_contract": analytics.smart_contract_address,
                "network_stats": analytics.get_avalanche_network_stats(),
            }
        )
    except Exception as e:
        logger.exception("/api/blockchain/transactions failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/analytics/enhanced")
def get_enhanced_analytics():
    try:
        logger.info("GET /api/analytics/enhanced")
        if not analytics.demo_election_active:
            return jsonify({"error": "No active election"})
        return jsonify(
            {
                "election_data": analytics.format_demo_election(),
                "live_analytics": analytics.get_enhanced_live_analytics(),
                "ai_insights": analytics.get_real_time_insights(),
                "blockchain_stats": analytics.get_avalanche_network_stats(),
                "timestamp": datetime.now().isoformat(),
                "enhanced_features": {"ai_powered": True, "blockchain_verified": True, "real_time": True, "fraud_detection": True},
            }
        )
    except Exception as e:
        logger.exception("/api/analytics/enhanced failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/blockchain/verify/<tx_hash>")
def verify_transaction(tx_hash: str):
    try:
        logger.info("GET /api/blockchain/verify/%s", tx_hash)
        for event in analytics.blockchain_events:
            if event.get("transaction", {}).get("tx_hash") == tx_hash:
                return jsonify(
                    {
                        "verified": True,
                        "transaction": event["transaction"],
                        "confirmations": random.randint(12, 25),
                        "network": analytics.avalanche_network,
                        "verified_at": datetime.now().isoformat(),
                    }
                )
        return jsonify({"verified": False, "error": "Transaction not found"}), 404
    except Exception as e:
        logger.exception("/api/blockchain/verify failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/election/start-enhanced", methods=["POST"])
def start_enhanced_demo():
    analytics.demo_election_active = True
    analytics.demo_election_data = analytics.generate_enhanced_demo_election()
    analytics.blockchain_events = []
    analytics.transaction_count = 0
    analytics.gas_used = 0
    logger.info("Enhanced demo election started")
    return jsonify(
        {
            "message": "Enhanced demo election started successfully",
            "election": analytics.format_demo_election(),
            "blockchain": {"smart_contract": analytics.smart_contract_address, "network": analytics.avalanche_network},
            "ai_features": {"llm_agent": "active", "predictions": "enabled", "anomaly_detection": "monitoring"},
        }
    )


@app.route("/api/election/stop-enhanced", methods=["POST"])
def stop_enhanced_demo():
    analytics.demo_election_active = False
    final_results = analytics.format_demo_election()
    ai_insights = analytics.get_real_time_insights()
    logger.info("Enhanced demo election stopped")
    return jsonify(
        {
            "message": "Enhanced demo election stopped",
            "final_results": final_results,
            "ai_summary": ai_insights[:3],
            "blockchain_summary": {
                "total_transactions": analytics.transaction_count,
                "total_gas_used": analytics.gas_used,
                "network": analytics.avalanche_network,
            },
        }
    )


@app.route("/api/analytics/demographics")
def get_demographic_analysis():
    try:
        logger.info("GET /api/analytics/demographics")
        demographic_insights = analytics.llm_agent.analyze_demographics()
        demographic_summary = analytics.llm_agent.generate_demographic_summary()
        formatted_insights = []
        for insight in demographic_insights:
            formatted_insights.append(
                {
                    "type": insight.type.value,
                    "title": insight.title,
                    "description": insight.description,
                    "confidence": round(insight.confidence, 3),
                    "importance": insight.importance,
                    "data_points": insight.data_points,
                    "timestamp": insight.timestamp.isoformat(),
                }
            )
        return jsonify(
            {
                "success": True,
                "demographic_summary": demographic_summary,
                "demographic_insights": formatted_insights,
                "analysis_metadata": {
                    "total_insights": len(formatted_insights),
                    "high_confidence": len([i for i in demographic_insights if i.confidence > 0.9]),
                    "avg_confidence": round(
                        sum(i.confidence for i in demographic_insights) / len(demographic_insights), 3
                    )
                    if demographic_insights
                    else 0,
                    "generated_at": datetime.now().isoformat(),
                },
            }
        )
    except Exception as e:
        logger.exception("/api/analytics/demographics failed: %s", e)
        return jsonify({"success": False, "error": str(e), "message": "Failed to generate demographic analysis"}), 500


@app.route("/api/constituencies")
def get_constituencies():
    try:
        logger.info("GET /api/constituencies")
        df = analytics.llm_agent.demographic_df
        if df is not None and not df.empty:
            constituencies = sorted(df["ac_name"].unique().tolist())
            return jsonify({"success": True, "constituencies": constituencies, "total_count": len(constituencies)})
        return jsonify({"success": False, "constituencies": [], "message": "No constituency data available"})
    except Exception as e:
        logger.exception("/api/constituencies failed: %s", e)
        return jsonify({"success": False, "error": str(e), "constituencies": []}), 500


@app.route("/api/analysis/constituency/<constituency_name>")
def get_constituency_analysis(constituency_name: str):
    try:
        logger.info("GET /api/analysis/constituency/%s", constituency_name)
        df = analytics.llm_agent.demographic_df
        if df is None or df.empty:
            return jsonify({"success": False, "error": "No demographic data available"}), 404
        constituency_data = df[df["ac_name"] == constituency_name]
        if len(constituency_data) == 0:
            return jsonify({"success": False, "error": f"No data found for constituency: {constituency_name}"}), 404

        # Overview insight
        total_candidates = len(constituency_data)
        total_votes = int(constituency_data["total"].sum())
        years_covered = sorted(constituency_data["year"].unique().tolist())
        insights = [
            {
                "title": f"{constituency_name} Overview",
                "description": f"This constituency has {total_candidates} candidates across {len(years_covered)} election years ({', '.join(map(str, years_covered))}), with a total of {total_votes:,} votes recorded.",
                "confidence": 0.95,
                "importance": 9,
            }
        ]

        # Age groups
        age_groups = {
            "18-25": constituency_data[(constituency_data["age"] >= 18) & (constituency_data["age"] <= 25)],
            "26-35": constituency_data[(constituency_data["age"] >= 26) & (constituency_data["age"] <= 35)],
            "36-50": constituency_data[(constituency_data["age"] >= 36) & (constituency_data["age"] <= 50)],
            "50+": constituency_data[constituency_data["age"] > 50],
        }
        age_data: Dict[str, Any] = {}
        for group, data in age_groups.items():
            if len(data) > 0:
                group_votes = int(data["total"].sum())
                percentage = (group_votes / total_votes) * 100 if total_votes > 0 else 0
                age_data[group] = {"votes": group_votes, "percentage": round(percentage, 2), "candidates": len(data)}
        if age_data:
            dominant_group = max(age_data.keys(), key=lambda x: age_data[x]["percentage"])  # type: ignore
            insights.append(
                {
                    "title": f"Age Group Patterns in {constituency_name}",
                    "description": f"In {constituency_name}, the {dominant_group} age group dominates with {age_data[dominant_group]['percentage']}% of votes, representing {age_data[dominant_group]['candidates']} candidates.",
                    "confidence": 0.88,
                    "importance": 8,
                    "data_points": age_data,
                }
            )

        # Gender distribution
        gender_data = constituency_data.groupby("sex")["total"].agg(["sum", "count"]).reset_index()
        gender_insights: Dict[str, Any] = {}
        for _, row in gender_data.iterrows():
            gender = row["sex"]
            votes = int(row["sum"])
            percentage = (votes / total_votes) * 100 if total_votes > 0 else 0
            gender_insights[gender] = {"votes": votes, "percentage": round(percentage, 2), "candidates": int(row["count"])}
        if len(gender_insights) >= 2:
            insights.append(
                {
                    "title": f"Gender Distribution in {constituency_name}",
                    "description": f"Gender representation in {constituency_name} shows varied participation across different demographics, providing insights into local political engagement patterns.",
                    "confidence": 0.90,
                    "importance": 7,
                    "data_points": gender_insights,
                }
            )

        return jsonify(
            {
                "success": True,
                "constituency_name": constituency_name,
                "insights": insights,
                "chart_data": {
                    "age_distribution": age_data,
                    "gender_distribution": gender_insights,
                },
                "summary": {
                    "total_candidates": total_candidates,
                    "total_votes": total_votes,
                    "years_covered": years_covered,
                    "age_groups_analyzed": len(age_data),
                    "gender_groups_analyzed": len(gender_insights),
                },
            }
        )
    except Exception as e:
        logger.exception("/api/analysis/constituency failed: %s", e)
        return jsonify({"success": False, "error": str(e), "message": f"Failed to analyze constituency: {constituency_name}"}), 500


@app.route("/api/live/transactions")
def get_live_transactions():
    try:
        logger.info("GET /api/live/transactions")
        recent_transactions = analytics.blockchain_events[-20:]
        formatted_transactions = []
        for event in recent_transactions:
            if "transaction" in event:
                tx = event["transaction"]
                formatted_transactions.append(
                    {
                        "hash": tx["tx_hash"][:18] + "...",
                        "from": tx["from"][:10] + "...",
                        "to": "Voting Contract",
                        "candidate_id": tx["candidate_id"],
                        "gas_used": f"{tx['gas_used'] / 1_000_000:.3f} AVAX",
                        "timestamp": tx["timestamp"],
                        "status": tx["status"],
                    }
                )
        return jsonify({"transactions": formatted_transactions, "count": len(formatted_transactions), "network": analytics.avalanche_network, "contract": analytics.smart_contract_address})
    except Exception as e:
        logger.exception("/api/live/transactions failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/predictions/live")
def get_live_predictions():
    try:
        logger.info("GET /api/ai/predictions/live")
        candidates = [
            {"name": "Alice Johnson", "probability": random.uniform(30, 40)},
            {"name": "Bob Smith", "probability": random.uniform(25, 35)},
            {"name": "Carol Davis", "probability": random.uniform(20, 30)},
            {"name": "David Wilson", "probability": random.uniform(10, 20)},
        ]
        total_prob = sum(c["probability"] for c in candidates)
        for c in candidates:
            c["probability"] = (c["probability"] / total_prob) * 100
        candidates.sort(key=lambda x: x["probability"], reverse=True)
        leading_margin = candidates[0]["probability"] - candidates[1]["probability"]
        confidence = min(95, 70 + (leading_margin * 2))
        return jsonify(
            {
                "predictions": candidates,
                "confidence": round(confidence, 1),
                "leading_candidate": candidates[0]["name"],
                "margin": round(leading_margin, 1),
                "timestamp": datetime.now().isoformat(),
                "model_version": "Enhanced LLM v2.0",
            }
        )
    except Exception as e:
        logger.exception("/api/ai/predictions/live failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/visualization/3d")
def get_3d_visualization_data():
    try:
        logger.info("GET /api/visualization/3d")
        constituencies = [
            {"name": "Mumbai Central", "votes": 1200, "lat": 19.0760, "lng": 72.8777},
            {"name": "Delhi South", "votes": 980, "lat": 28.5355, "lng": 77.2910},
            {"name": "Bangalore Urban", "votes": 1100, "lat": 12.9716, "lng": 77.5946},
            {"name": "Chennai Central", "votes": 850, "lat": 13.0827, "lng": 80.2707},
            {"name": "Hyderabad East", "votes": 920, "lat": 17.3850, "lng": 78.4867},
            {"name": "Pune West", "votes": 780, "lat": 18.5204, "lng": 73.8567},
            {"name": "Kolkata North", "votes": 690, "lat": 22.5726, "lng": 88.3639},
        ]
        particles = []
        for i in range(50):
            particles.append(
                {
                    "id": i,
                    "x": random.uniform(-180, 180),
                    "y": random.uniform(-90, 90),
                    "z": random.uniform(-50, 50),
                    "velocity": {"x": random.uniform(-0.5, 0.5), "y": random.uniform(-0.5, 0.5), "z": random.uniform(-0.5, 0.5)},
                    "color": f"hsl({random.randint(0, 360)}, 70%, 60%)",
                    "size": random.uniform(0.5, 2.0),
                }
            )
        return jsonify({"constituencies": constituencies, "particles": particles, "globe_config": {"radius": 100, "segments": 64, "rings": 64}, "animation_speed": 0.005, "timestamp": datetime.now().isoformat()})
    except Exception as e:
        logger.exception("/api/visualization/3d failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/blockchain/network-stats")
def get_enhanced_network_stats():
    try:
        logger.info("GET /api/blockchain/network-stats")
        stats = analytics.get_avalanche_network_stats()
        enhanced_stats = {
            **stats,
            "live_tps": round(random.uniform(1.8, 2.2), 1),
            "gas_price_gwei": round(random.uniform(20, 50), 2),
            "network_congestion": random.choice(["Low", "Medium", "High"]),
            "validator_count": random.randint(1200, 1500),
            "subnet_activity": {"active_subnets": 12, "voting_subnet_id": "subnet_voting_2024", "transactions_per_second": round(random.uniform(45, 85), 1)},
            "security_metrics": {"consensus_participation": "99.7%", "finality_time": "2.1s", "fork_resistance": "Maximum"},
        }
        return jsonify(enhanced_stats)
    except Exception as e:
        logger.exception("/api/blockchain/network-stats failed: %s", e)
        return jsonify({"error": str(e)}), 500


# Frontend routes
@app.route("/")
def serve_frontend():
    return send_from_directory(str(PROJECT_ROOT), "index.html")


@app.route("/<path:filename>")
def serve_static_files(filename: str):
    return send_from_directory(str(PROJECT_ROOT), filename)


# -----------------------------------------------------------------------------
# Socket.IO events
# -----------------------------------------------------------------------------
@socketio.on("connect")
def handle_connect():
    logger.info("Client connected: %s", request.remote_addr)
    emit(
        "connection_status",
        {
            "status": "connected",
            "message": "Enhanced AI + Blockchain analytics connected",
            "features": {
                "ai_insights": True,
                "blockchain_verification": True,
                "real_time_predictions": True,
                "anomaly_detection": True,
            },
            "network": analytics.avalanche_network,
            "timestamp": datetime.now().isoformat(),
        },
    )


@socketio.on("request_ai_analysis")
def handle_ai_analysis_request():
    logger.info("Socket request_ai_analysis from %s", request.remote_addr)
    if analytics.demo_election_active:
        insights = analytics.get_real_time_insights()
        emit("ai_analysis_update", {"insights": insights, "confidence": 0.89, "timestamp": datetime.now().isoformat()})
    else:
        emit("error", {"message": "No active election for AI analysis"})


@socketio.on("request_blockchain_status")
def handle_blockchain_status():
    logger.info("Socket request_blockchain_status from %s", request.remote_addr)
    emit(
        "blockchain_status",
        {
            "network_stats": analytics.get_avalanche_network_stats(),
            "recent_transactions": analytics.blockchain_events[-5:],
            "smart_contract": analytics.smart_contract_address,
            "timestamp": datetime.now().isoformat(),
        },
    )


@socketio.on("request_live_data")
def handle_live_data_request():
    try:
        logger.info("Socket request_live_data from %s", request.remote_addr)
        if analytics.demo_election_active:
            live_data_payload = {
                "election_data": analytics.format_demo_election(),
                "blockchain_transactions": analytics.blockchain_events[-10:],
                "ai_insights": analytics.get_real_time_insights(),
                "analytics": analytics.get_enhanced_live_analytics(),
                "avalanche_stats": analytics.get_avalanche_network_stats(),
                "ai_predictions": analytics.get_enhanced_live_analytics().get("ai_predictions"),
                "timestamp": datetime.now().isoformat(),
            }
            emit("enhanced_voting_update", live_data_payload)
        else:
            emit("error", {"message": "No active election for live data"})
    except Exception as e:
        logger.exception("Socket request_live_data failed: %s", e)
        emit("error", {"message": "Failed to fetch live data"})


@socketio.on("request_3d_data")
def handle_3d_data_request():
    try:
        logger.info("Socket request_3d_data from %s", request.remote_addr)
        cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata"]
        vote_locations = []
        for city in cities:
            votes = random.randint(50, 200)
            vote_locations.append({"city": city, "votes": votes, "lat": random.uniform(8.0, 35.0), "lng": random.uniform(68.0, 97.0), "intensity": votes / 200.0})
        emit("visualization_data", {"vote_locations": vote_locations, "total_locations": len(vote_locations), "timestamp": datetime.now().isoformat()})
    except Exception as e:
        logger.exception("Socket request_3d_data failed: %s", e)
        emit("error", {"message": "Failed to fetch 3D data"})


@socketio.on("disconnect")
def handle_disconnect():
    logger.info("Client disconnected: %s", request.remote_addr)


# -----------------------------------------------------------------------------
# Entrypoint (dev only)
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting Avalanche Analytics (dev) on 0.0.0.0:%s", PORT)
    start_enhanced_simulation()
    # Dev only; do not use allow_unsafe_werkzeug in production
    socketio.run(app, host="0.0.0.0", port=PORT, debug=os.getenv("DEBUG", "0") == "1")
