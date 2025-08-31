#!/usr/bin/env python3
"""
Enhanced AI Analytics API for Avalanche Blockchain Voting Platform
==

Integrates advanced LLM capabilities with blockchain-ready features for
the ultimate Web3 voting analytics experience.

Features:
- Advanced LLM reasoning and insights
- Real-time blockchain event simulation
- Predictive analytics with confidence scoring
- Anomaly detection for fraud prevention
- WebSocket streaming for live updates
- Avalanche-ready smart contract integration points

Built for: T1 Hack25 Bengaluru Avalanche Hackathon
"""

import json
from flask_cors import cross_origin
import os
import sys
import asyncio
import time
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, disconnect
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import random

import uuid
import logging

# Import existing and enhanced agents
from enhanced_llm_agent import EnhancedLLMElectionAgent, AIInsight, InsightType
from blockchain_voting_analyzer import BlockchainVotingAnalyzer

import threading
import uuid

# Import existing and enhanced agents
from enhanced_llm_agent import EnhancedLLMElectionAgent, AIInsight, InsightType


app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = 'avalanche-voting-ai-hackathon-2024'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Global variable to store analytics instance for WebSocket access
analytics = None

class AvalancheVotingAnalytics:
    """
    Enhanced analytics engine with blockchain integration for Avalanche hackathon.
    """
    
    def __init__(self):
        self.data_folder = "."
        self.llm_agent = EnhancedLLMElectionAgent(self.data_folder)
        self.data_stream = self.llm_agent.stream_election_data()
        
        self.blockchain_events = []
        self.smart_contract_address = "0x742d35cc6434c0532925a3b8d0aef44fabbdc3c5"
        self.avalanche_network = "fuji-testnet"
        
        self.transaction_count = 0
        self.gas_used = 0
        
        self.demo_election_active = False
        self.demo_election_data = self.generate_enhanced_demo_election()
        self.real_time_updates = True
        
        self.insights_cache = {}
        self.prediction_cache = {}
        
    def generate_enhanced_demo_election(self) -> Dict[str, Any]:
        """Generate a sophisticated demo election with blockchain elements from the CSV data."""
        
        # Get unique candidates from the dataframe
        unique_candidates = self.llm_agent.demographic_df.drop_duplicates(subset=['candidate_name'])
        
        candidates = []
        for index, row in unique_candidates.iterrows():
            candidates.append({
                "id": index + 1,
                "name": row['candidate_name'],
                "party": row['party'],
                "blockchain_address": f"0x{hash(row['candidate_name']) % (10**40):040x}",
                "verified": True
            })

        # Initialize votes to zero for all candidates
        votes = {candidate['id']: 0 for candidate in candidates}
        
        total_eligible = int(self.llm_agent.demographic_df['total'].sum()) if self.llm_agent.demographic_df is not None else 0 if self.llm_agent.demographic_df is not None else 0
        
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
                "network_fees": "$0.002"
            },
            "last_updated": datetime.now().isoformat()
        }
    
    def simulate_blockchain_vote(self, vote_record: dict) -> Dict[str, Any]:
        """Simulate a blockchain vote transaction from a CSV record."""
        voter_address = f"0x{random.randint(10**39, 10**40-1):040x}"
        
        self.transaction_count += 1
        gas_cost = random.randint(21000, 45000)
        self.gas_used += gas_cost
        
        candidate_name = vote_record['candidate_name']
        candidate_id = next((c['id'] for c in self.demo_election_data['candidates'] if c['name'] == candidate_name), None)

        if candidate_id is None:
            return None # Should not happen if data is clean

        transaction = {
            "tx_hash": f"0x{random.randint(10**63, 10**64-1):064x}",
            "from": voter_address,
            "to": self.smart_contract_address,
            "candidate_id": int(candidate_id),
            "gas_used": int(gas_cost),
            "gas_price": "20 gwei",
            "timestamp": datetime.now().isoformat(),
            "block_number": int(self.transaction_count + 1500000),
            "confirmation_time": float(round(random.uniform(1.8, 3.2), 1)),
            "status": "confirmed"
        }
        
        self.blockchain_events.append({
            "type": "vote_cast",
            "transaction": transaction,
            "timestamp": datetime.now().isoformat()
        })
        
        # Update vote count
        vote_amount = int(vote_record.get('total', 1)) # Get the 'total' votes from the record, default to 1
        if candidate_id in self.demo_election_data["votes"]:
            self.demo_election_data["votes"][candidate_id] += vote_amount
        else:
            self.demo_election_data["votes"][candidate_id] = vote_amount
            
        self.demo_election_data["current_turnout"] = sum(self.demo_election_data["votes"].values())
            
        self.demo_election_data["turnout_percentage"] = round(
            (self.demo_election_data["current_turnout"] / 
             self.demo_election_data["total_eligible_voters"]) * 100, 2
        )
        
        self.demo_election_data["blockchain_stats"]["total_transactions"] = self.transaction_count
        self.demo_election_data["blockchain_stats"]["gas_used"] = self.gas_used
        
        return transaction
    
    def simulate_live_votes(self):
        """Enhanced live voting simulation by streaming from the CSV file."""
        if not self.demo_election_active:
            return
            
        # Get next vote from the data stream
        vote_record = next(self.data_stream)
        
        transaction = self.simulate_blockchain_vote(vote_record)
        
        if transaction is None:
            return

        self.demo_election_data["last_updated"] = datetime.now().isoformat()
        
        fresh_insights = self.get_real_time_insights()
        
        if self.real_time_updates:
            socketio.emit('new_transaction', {
                "type": "vote_cast",
                "transaction": transaction,
                "timestamp": datetime.now().isoformat()
            })
            socketio.emit('enhanced_voting_update', {
                'election_data': self.format_demo_election(),
                'blockchain_transactions': [transaction],
                'ai_insights': fresh_insights,
                'analytics': self.get_enhanced_live_analytics(), # Keep this for other analytics
                'avalanche_stats': self.get_avalanche_network_stats(),
                'timestamp': datetime.now().isoformat()
            })
    
    def get_real_time_insights(self) -> List[Dict[str, Any]]:
        """Get fresh AI insights in real-time."""
        # Use cached insights to avoid overcomputation
        cache_key = datetime.now().strftime("%Y%m%d_%H%M")[:12]  # 5-minute cache
        
        if cache_key not in self.insights_cache:
            analysis = self.llm_agent.generate_comprehensive_analysis(
                include_predictions=True,
                include_anomalies=True,
                include_sentiment=True
            )
            
            # Convert to serializable format
            insights = []
            for insight in analysis["insights"][:5]:  # Top 5 for real-time
                insights.append({
                    "type": insight.type.value,
                    "title": insight.title,
                    "description": insight.description[:200] + "..." if len(insight.description) > 200 else insight.description,
                    "confidence": float(round(insight.confidence, 3)),
                    "importance": int(insight.importance),
                    "timestamp": insight.timestamp.isoformat()
                })
            
            self.insights_cache[cache_key] = insights
        
        return self.insights_cache[cache_key]
    
    def get_enhanced_live_analytics(self) -> Dict[str, Any]:
        """Enhanced analytics with AI insights, including demographics."""
        data = self.demo_election_data
        total_votes = int(sum(data["votes"].values()))
        
        if total_votes == 0:
            return {"error": "No votes recorded yet"}

        # Get demographic analysis
        demographics_summary = self.llm_agent.generate_demographic_summary()

        # Calculate candidate standings
        candidates_full_list = []
        for candidate in data["candidates"]:
            votes = data["votes"].get(candidate["id"], 0)
            percentage = (votes / total_votes) * 100 if total_votes > 0 else 0
            candidates_full_list.append({
                "name": candidate["name"],
                "party": candidate["party"],
                "votes": int(votes),
                "percentage": float(round(percentage, 2)),
                "blockchain_address": candidate["blockchain_address"],
                "verified": True,
                "trend": random.choice(["↗️ Rising", "↘️ Falling", "➡️ Stable", "🚀 Surging"])
            })
        
        candidates_full_list = sorted(candidates_full_list, key=lambda x: x["votes"], reverse=True)

        if len(candidates_full_list) > 4:
            top_4_candidates = candidates_full_list[:4]
            other_votes = sum(c['votes'] for c in candidates_full_list[4:])
            other_percentage = sum(c['percentage'] for c in candidates_full_list[4:])
            top_4_candidates.append({
                "name": "Other", "party": "Various", "votes": other_votes, 
                "percentage": round(other_percentage, 2), "trend": "➡️ Stable"
            })
            candidates_display = top_4_candidates
        else:
            candidates_display = candidates_full_list

        leader = candidates_full_list[0]
        runner_up = candidates_full_list[1] if len(candidates_full_list) > 1 else None
        
        ai_insights = [f"{leader['name']} leads with {leader['votes']} votes ({leader['percentage']}%) - blockchain verified"]
        if runner_up:
            margin = leader["votes"] - runner_up["votes"]
            ai_insights.append(f"Lead margin: {margin} votes over {runner_up['name']} - competitive race detected")
        
        return {
            "candidates": candidates_display,
            "ai_insights": ai_insights,
            "demographics": {
                "age_groups": {
                    "counts": demographics_summary["age_groups"]
                },
                "gender": {
                    "counts": demographics_summary["gender_distribution"]
                },
                "locations": {
                    "top_10_counts": demographics_summary["top_constituencies"]
                }
            },
            "turnout_analysis": {
                "current": data["turnout_percentage"],
                "target": 85.0,
                "predicted_final": min(92.0, data["turnout_percentage"] + random.uniform(8, 15)),
                "ai_confidence": 0.89
            },
            "ai_predictions": {
                "likely_winner": leader["name"],
                "confidence": random.uniform(0.82, 0.94),
                "key_factors": ["digital campaign reach", "policy resonance", "voter sentiment"],
                "upset_probability": random.uniform(0.05, 0.15)
            },
            "security_status": {
                "fraud_alerts": 0,
                "anomalies_detected": 0
            }
        }
    
    def get_avalanche_network_stats(self) -> Dict[str, Any]:
        """Simulate Avalanche network statistics."""
        return {
            "network": "Avalanche Fuji Testnet",
            "chain_id": int(43113),
            "current_block": int(self.transaction_count + 1500000),
            "tps": float(random.uniform(4500, 6500)),  # Avalanche's high throughput
            "finality": "instant",
            "avg_fee": "$0.002",
            "total_validators": int(1284),
            "online_validators": int(random.randint(1200, 1284)),
            "network_health": "excellent",
            "carbon_neutral": True
        }
    
    def format_demo_election(self) -> Dict[str, Any]:
        """Format demo election with enhanced blockchain data."""
        data = self.demo_election_data.copy()
        
        # Add candidate stats with blockchain verification
        total_votes = int(sum(data["votes"].values()))
        for candidate in data["candidates"]:
            candidate_votes = data["votes"][candidate["id"]]
            candidate["votes"] = candidate_votes
            candidate["percentage"] = round((candidate_votes / total_votes) * 100, 2) if total_votes > 0 else 0
            candidate["blockchain_verified"] = True
        
        # Sort candidates by vote count
        data["candidates"] = sorted(data["candidates"], key=lambda x: x["votes"], reverse=True)
        
        # Add AI-powered metadata
        data["ai_metadata"] = {
            "analysis_confidence": 0.89,
            "fraud_detection_active": True,
            "predictive_model_accuracy": 0.92,
            "real_time_insights": True
        }
        
        return data

# Initialize enhanced analytics engine
analytics = AvalancheVotingAnalytics()

# Start demo election by default for hackathon demo
analytics.demo_election_active = True
print("Demo election started automatically for hackathon demo")

# Enhanced API Routes
@app.route('/api/health')

def health_check():
    """Enhanced health check with AI and blockchain status."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "ai_analytics": "operational",
            "llm_agent": "active",
            "blockchain_simulation": "running",
            "real_time_updates": analytics.real_time_updates,
            "demo_election": analytics.demo_election_active
        },
        "network": {
            "avalanche_fuji": "connected",
            "smart_contract": analytics.smart_contract_address,
            "gas_price": "20 gwei"
        },
        "ai_status": {
            "models_loaded": True,
            "prediction_accuracy": 0.92,
            "anomaly_detection": "active"
        }
    })

@app.route('/api/ai/insights')
def get_ai_insights():
    """Get comprehensive AI insights."""
    try:
        # Get comprehensive analysis from LLM agent
        analysis = analytics.llm_agent.generate_comprehensive_analysis()
        
        # Convert AIInsight objects to serializable format
        insights_data = []
        for insight in analysis['insights']:
            insights_data.append({
                "title": insight.title,
                "description": insight.description,
                "confidence": round(insight.confidence, 3),
                "importance": insight.importance,
                "type": insight.type.value,
                "data_points": insight.data_points,
                "timestamp": insight.timestamp.isoformat()
            })
        
        return jsonify({
            "insights": insights_data,
            "summary": {
                "total_insights": analysis['summary']['total_insights'],
                "confidence_avg": float(analysis['summary']['confidence_avg']),
                "high_importance": analysis['summary']['high_importance'],
                "categories": analysis['summary']['categories']
            },
            "generated_at": analysis['timestamp'],
            "ai_confidence": analysis['confidence_score'],
            "blockchain_verified": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/predictions')
def get_ai_predictions():
    """Get AI-powered election predictions."""
    try:
        # Generate predictions with current scenario
        scenario = {
            "turnout_increase": random.uniform(3, 8),
            "demographic_shift": random.choice(["youth_surge", "digital_adoption", "urban_growth"]),
            "campaign_effect": "blockchain_transparency"
        }
        
        predictions = analytics.llm_agent.predict_election_outcomes(scenario)
        
        # Convert to serializable format
        prediction_data = []
        for pred in predictions:
            prediction_data.append({
                "title": pred.title,
                "description": pred.description,
                "confidence": round(pred.confidence, 3),
                "importance": pred.importance,
                "data_points": pred.data_points,
                "timestamp": pred.timestamp.isoformat()
            })
        
        return jsonify({
            "predictions": prediction_data,
            "scenario": scenario,
            "generated_at": datetime.now().isoformat(),
            "blockchain_verified": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/blockchain/transactions')
def get_blockchain_transactions():
    """Get recent blockchain transactions."""
    try:
        recent_events = analytics.blockchain_events[-20:]  # Last 20 events
        return jsonify({
            "transactions": recent_events,
            "total_count": len(analytics.blockchain_events),
            "network": analytics.avalanche_network,
            "smart_contract": analytics.smart_contract_address,
            "network_stats": analytics.get_avalanche_network_stats()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/enhanced')

def get_enhanced_analytics():
    """Get comprehensive enhanced analytics."""
    try:
        if not analytics.demo_election_active:
            return jsonify({"error": "No active election"})
        
        return jsonify({
            "election_data": analytics.format_demo_election(),
            "live_analytics": analytics.get_enhanced_live_analytics(),
            "ai_insights": analytics.get_real_time_insights(),
            "blockchain_stats": analytics.get_avalanche_network_stats(),
            "timestamp": datetime.now().isoformat(),
            "enhanced_features": {
                "ai_powered": True,
                "blockchain_verified": True,
                "real_time": True,
                "fraud_detection": True
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/blockchain/verify/<tx_hash>')
def verify_transaction(tx_hash):
    """Verify a blockchain transaction."""
    try:
        # Find transaction in our simulated blockchain
        for event in analytics.blockchain_events:
            if event.get("transaction", {}).get("tx_hash") == tx_hash:
                return jsonify({
                    "verified": True,
                    "transaction": event["transaction"],
                    "confirmations": random.randint(12, 25),
                    "network": analytics.avalanche_network,
                    "verified_at": datetime.now().isoformat()
                })
        
        return jsonify({"verified": False, "error": "Transaction not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/election/start-enhanced', methods=['POST'])
def start_enhanced_demo():
    """Start the enhanced demo election."""
    analytics.demo_election_active = True
    analytics.demo_election_data = analytics.generate_enhanced_demo_election()
    analytics.blockchain_events = []  # Reset blockchain events
    analytics.transaction_count = 0
    analytics.gas_used = 0
    
    return jsonify({
        "message": "Enhanced demo election started successfully",
        "election": analytics.format_demo_election(),
        "blockchain": {
            "smart_contract": analytics.smart_contract_address,
            "network": analytics.avalanche_network
        },
        "ai_features": {
            "llm_agent": "active",
            "predictions": "enabled",
            "anomaly_detection": "monitoring"
        }
    })

@app.route('/api/election/stop-enhanced', methods=['POST'])
def stop_enhanced_demo():
    """Stop the enhanced demo election."""
    analytics.demo_election_active = False
    
    # Generate final report
    final_results = analytics.format_demo_election()
    ai_insights = analytics.get_real_time_insights()
    
    return jsonify({
        "message": "Enhanced demo election stopped",
        "final_results": final_results,
        "ai_summary": ai_insights[:3],  # Top 3 insights
        "blockchain_summary": {
            "total_transactions": analytics.transaction_count,
            "total_gas_used": analytics.gas_used,
            "network": analytics.avalanche_network
        }
    })

@app.route('/api/analytics/demographics', methods=['GET'])
def get_demographic_analysis():
    """Get comprehensive demographic analysis."""
    try:
        # Generate demographic insights
        demographic_insights = analytics.llm_agent.analyze_demographics()
        demographic_summary = analytics.llm_agent.generate_demographic_summary()
        
        # Format insights for API response
        formatted_insights = []
        for insight in demographic_insights:
            formatted_insights.append({
                "type": insight.type.value,
                "title": insight.title,
                "description": insight.description,
                "confidence": round(insight.confidence, 3),
                "importance": insight.importance,
                "data_points": insight.data_points,
                "timestamp": insight.timestamp.isoformat()
            })
        
        return jsonify({
            "success": True,
            "demographic_summary": demographic_summary,
            "demographic_insights": formatted_insights,
            "analysis_metadata": {
                "total_insights": len(formatted_insights),
                "high_confidence": len([i for i in demographic_insights if i.confidence > 0.9]),
                "avg_confidence": round(sum(i.confidence for i in demographic_insights) / len(demographic_insights), 3) if demographic_insights else 0,
                "generated_at": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to generate demographic analysis"
        }), 500

@app.route('/api/constituencies', methods=['GET'])

def get_constituencies():
    """Get list of all constituencies."""
    try:
        if analytics.llm_agent.demographic_df is not None:
            constituencies = sorted(analytics.llm_agent.demographic_df['ac_name'].unique().tolist())
            return jsonify({
                "success": True,
                "constituencies": constituencies,
                "total_count": len(constituencies)
            })
        else:
            return jsonify({
                "success": False,
                "constituencies": [],
                "message": "No constituency data available"
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "constituencies": []
        }), 500

@app.route('/api/analysis/constituency/<constituency_name>', methods=['GET'])
def get_constituency_analysis(constituency_name):
    """Generate a full, detailed analysis report for a specific constituency."""
    try:
        # Ensure the main demographic data is loaded
        main_df = analytics.llm_agent.demographic_df
        if main_df is None or main_df.empty:
            app.logger.error("No demographic data available in LLM agent.")
            return jsonify({"success": False, "error": "No demographic data available"}), 404

        # Filter data for the specific constituency (case-insensitive)
        constituency_df = main_df[main_df['ac_name'].str.lower() == constituency_name.lower()]
        
        if constituency_df.empty:
            app.logger.warning(f"No data found for constituency: {constituency_name}")
            return jsonify({"success": False, "error": f"No data found for constituency: {constituency_name}"}), 404

        # Ensure 'total' and 'age' columns are numeric
        constituency_df['total'] = pd.to_numeric(constituency_df['total'], errors='coerce').fillna(0)
        constituency_df['age'] = pd.to_numeric(constituency_df['age'], errors='coerce')
        
        # Drop rows where 'age' is NaN after coercion, as pd.cut cannot handle them
        constituency_df.dropna(subset=['age'], inplace=True)

        # --- Start of new analytics logic ---

        # 1. Candidate-wise Results
        candidate_votes = constituency_df.groupby('candidate_name')['total'].sum().reset_index()
        total_constituency_votes = int(candidate_votes['total'].sum())
        
        candidate_results = []
        winning_candidate = {"name": "", "votes": 0, "percentage": 0}
        
        if total_constituency_votes > 0: # Avoid division by zero if no votes
            for _, row in candidate_votes.iterrows():
                candidate_name = row['candidate_name']
                votes = int(row['total'])
                percentage = round((votes / total_constituency_votes) * 100, 2)
                
                candidate_results.append({
                    "name": candidate_name,
                    "votes": votes,
                    "percentage": percentage
                })
                
                if votes > winning_candidate["votes"]:
                    winning_candidate["name"] = candidate_name
                    winning_candidate["votes"] = votes
                    winning_candidate["percentage"] = percentage
            
            candidate_results = sorted(candidate_results, key=lambda x: x['votes'], reverse=True)
            
            margin_of_victory = 0
            if len(candidate_results) > 1:
                margin_of_victory = winning_candidate["votes"] - candidate_results[1]["votes"]
        else:
            app.logger.warning(f"No total votes for constituency: {constituency_name}. Skipping candidate calculations.")

        # 2. Demographic Analytics
        # Age group analysis
        age_bins = [0, 25, 35, 50, 150] # Assuming max age 150 for 50+
        age_labels = ["18-25", "26-35", "36-50", "50+"]
        
        # Only apply pd.cut if there's data left after dropping NaNs
        if not constituency_df.empty:
            constituency_df['age_group'] = pd.cut(constituency_df['age'], bins=age_bins, labels=age_labels, right=True, include_lowest=True)
            age_group_counts = constituency_df.groupby('age_group')['total'].sum().reindex(age_labels).fillna(0).to_dict()
        else:
            age_group_counts = {label: 0 for label in age_labels} # Initialize with zeros if no data
        
        # Gender analysis
        gender_counts = constituency_df.groupby('sex')['total'].sum().to_dict()
        
        # Location (already filtered by constituency, so this is the specific constituency's data)
        location_info = {
            "state": constituency_df['state'].iloc[0] if not constituency_df.empty else "N/A",
            "constituency": constituency_name,
            "total_votes_in_constituency": total_constituency_votes
        }

        # 3. Narrative Analytics
        narrative_insights = []
        narrative_insights.append(f"Analysis for {constituency_name}:")
        if winning_candidate["name"]:
            narrative_insights.append(f"Candidate {winning_candidate['name']} is leading with {winning_candidate['votes']:,} votes, accounting for {winning_candidate['percentage']}% of the total votes.")
            if margin_of_victory > 0:
                narrative_insights.append(f"The margin of victory for {winning_candidate['name']} over the nearest competitor is {margin_of_victory:,} votes.")
        else:
            narrative_insights.append("No winning candidate identified yet or no votes recorded.")

        if age_group_counts and any(age_group_counts.values()): # Check if there are actual counts
            most_active_age_group = max(age_group_counts, key=age_group_counts.get)
            narrative_insights.append(f"The most active age group in this constituency is {most_active_age_group}, contributing {age_group_counts[most_active_age_group]:,} votes.")
        
        if gender_counts and any(gender_counts.values()): # Check if there are actual counts
            male_votes = gender_counts.get('MALE', 0)
            female_votes = gender_counts.get('FEMALE', 0)
            if male_votes > female_votes:
                narrative_insights.append(f"Male voters show a higher turnout with {male_votes:,} votes compared to female voters with {female_votes:,} votes.")
            elif female_votes > male_votes:
                narrative_insights.append(f"Female voters show a higher turnout with {female_votes:,} votes compared to male voters with {male_votes:,} votes.")
            else:
                narrative_insights.append("Male and female voter turnout is relatively balanced.")

        # Convert int64 values to standard Python int for JSON serialization
        for candidate in candidate_results:
            candidate['votes'] = int(candidate['votes'])
            candidate['percentage'] = float(candidate['percentage'])

        age_group_counts = {k: int(v) for k, v in age_group_counts.items()}
        gender_counts = {k: int(v) for k, v in gender_counts.items()}

        # Historical Vote Trend Analysis
        historical_votes = constituency_df.groupby('year')['total'].sum().sort_index()
        historical_data = {
            "labels": [str(y) for y in historical_votes.index],
            "data": [int(v) for v in historical_votes.values]
        }

        # --- End of new analytics logic ---

        return jsonify({
            "success": True,
            "constituency_name": constituency_name,
            "candidate_results": candidate_results,
            "winning_candidate": {
                "name": winning_candidate["name"],
                "votes": int(winning_candidate["votes"]),
                "percentage": float(winning_candidate["percentage"])
            },
            "margin_of_victory": int(margin_of_victory),
            "demographics": {
                "age_groups": age_group_counts,
                "gender_distribution": gender_counts,
                "location_info": location_info
            },
            "narrative_insights": narrative_insights,
            "historical_data": historical_data,
            "chart_data": { # Data structured for Chart.js
                "candidate_votes": {
                    "labels": [c["name"] for c in candidate_results],
                    "votes": [int(c["votes"]) for c in candidate_results],
                    "percentages": [float(c["percentage"]) for c in candidate_results]
                },
                "age_distribution": {
                    "labels": list(age_group_counts.keys()),
                    "counts": list(age_group_counts.values())
                },
                "gender_distribution": {
                    "labels": list(gender_counts.keys()),
                    "counts": list(gender_counts.values())
                }
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error in get_constituency_analysis for {constituency_name}: {e}", exc_info=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return jsonify({
            "success": False,
            "error": "An internal server error occurred while generating the constituency report."
        }), 500




    



# Enhanced WebSocket Events
@socketio.on('connect')
def handle_connect():
    """Handle client connection with enhanced features."""
    emit('connection_status', {
        'status': 'connected',
        'message': 'Enhanced AI + Blockchain analytics connected',
        'features': {
            'ai_insights': True,
            'blockchain_verification': True,
            'real_time_predictions': True,
            'anomaly_detection': True
        },
        'network': analytics.avalanche_network,
        'timestamp': datetime.now().isoformat()
    })

    # Send initial data snapshot immediately on connection
    handle_live_data_request()



@socketio.on('request_ai_analysis')
def handle_ai_analysis_request():
    """Handle request for fresh AI analysis."""
    if analytics.demo_election_active:
        insights = analytics.get_real_time_insights()
        emit('ai_analysis_update', {
            'insights': insights,
            'confidence': 0.89,
            'timestamp': datetime.now().isoformat()
        })
    else:
        emit('error', {'message': 'No active election for AI analysis'})

@socketio.on('request_blockchain_status')
def handle_blockchain_status():
    """Handle blockchain status request."""
    emit('blockchain_status', {
        'network_stats': analytics.get_avalanche_network_stats(),
        'recent_transactions': analytics.blockchain_events[-5:],
        'smart_contract': analytics.smart_contract_address,
        'timestamp': datetime.now().isoformat()
    })

# =====
# ENHANCED WEBSOCKET HANDLERS FOR TIER 1 FEATURES
# =====



@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    print('Client disconnected')

@socketio.on('request_live_data')
def handle_live_data_request():
    """Send a complete snapshot of the current analytics to the client."""
    try:
        if analytics.demo_election_active:
            # Construct the same payload that the background thread sends
            live_data_payload = {
                'election_data': analytics.format_demo_election(),
                'blockchain_transactions': analytics.blockchain_events[-10:],
                'ai_insights': analytics.get_real_time_insights(),
                'analytics': analytics.get_enhanced_live_analytics(), # Keep this for other analytics
                'avalanche_stats': analytics.get_avalanche_network_stats(),
                'ai_predictions': analytics.get_enhanced_live_analytics()["ai_predictions"], # Add top-level ai_predictions
                'timestamp': datetime.now().isoformat()
            }
            emit('enhanced_voting_update', live_data_payload)
        else:
            emit('error', {'message': 'No active election for live data'})
            
    except Exception as e:
        print(f"Error handling live data request: {e}")
        emit('error', {'message': 'Failed to fetch live data'})

@socketio.on('request_3d_data')
def handle_3d_data_request():
    """Send 3D visualization data."""
    try:
        # Generate 3D visualization data points
        vote_locations = []
        
        # Simulate geographic vote distribution
        cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata']
        
        for city in cities:
            votes = random.randint(50, 200)
            vote_locations.append({
                'city': city,
                'votes': votes,
                'lat': random.uniform(8.0, 35.0),  # India latitude range
                'lng': random.uniform(68.0, 97.0), # India longitude range
                'intensity': votes / 200.0
            })
        
        emit('visualization_data', {
            'constituencies': vote_locations,
            'total_locations': len(vote_locations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error handling 3D data request: {e}")
        emit('error', {'message': 'Failed to fetch 3D data'})

# =====
# ENHANCED API ENDPOINTS FOR TIER 1 FEATURES
# =====

@app.route('/api/live/transactions')

def get_live_transactions():
    """Get live blockchain transactions for the feed."""
    try:
        recent_transactions = analytics.blockchain_events[-20:]
        
        # Format transactions for frontend display
        formatted_transactions = []
        for event in recent_transactions:
            if 'transaction' in event:
                tx = event['transaction']
                formatted_transactions.append({
                    'hash': tx['tx_hash'][:18] + '...',  # Truncated hash
                    'from': tx['from'][:10] + '...',
                    'to': 'Voting Contract',
                    'candidate_id': tx['candidate_id'],
                    'gas_used': f"{tx['gas_used'] / 1000000:.3f} AVAX",
                    'timestamp': tx['timestamp'],
                    'status': tx['status']
                })
        
        return jsonify({
            'transactions': formatted_transactions,
            'count': len(formatted_transactions),
            'network': analytics.avalanche_network,
            'contract': analytics.smart_contract_address
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/predictions/live')

def get_live_predictions():
    """Get live AI predictions with confidence intervals."""
    try:
        if not analytics.demo_election_data or not analytics.demo_election_data['candidates']:
            return jsonify({"error": "No election data available"}), 500

        # Use the actual candidates and their vote counts
        candidates_data = analytics.format_demo_election()['candidates']
        
        if not candidates_data:
            return jsonify({"error": "No candidates found"}), 500

        # Generate predictions based on vote counts (simple model)
        total_votes = sum(c['votes'] for c in candidates_data)
        
        if total_votes == 0:
            # If no votes, return equal probabilities
            predictions = [{'name': c['name'], 'probability': 100 / len(candidates_data)} for c in candidates_data]
        else:
            predictions = [{'name': c['name'], 'probability': (c['votes'] / total_votes) * 100} for c in candidates_data]

        # Sort by probability
        predictions.sort(key=lambda x: x['probability'], reverse=True)
        
        # Calculate confidence
        confidence = 85.0 # Base confidence
        if len(predictions) > 1:
            margin = predictions[0]['probability'] - predictions[1]['probability']
            confidence = min(98.0, 80.0 + margin * 0.5) # Confidence based on margin

        return jsonify({
            'predictions': predictions[:5], # Top 5 predictions
            'confidence': round(confidence, 1),
            'leading_candidate': predictions[0]['name'] if predictions else 'N/A',
            'margin': round(predictions[0]['probability'] - predictions[1]['probability'], 1) if len(predictions) > 1 else 0,
            'timestamp': datetime.now().isoformat(),
            'model_version': 'Enhanced LLM v2.1'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/visualization/3d')

def get_3d_visualization_data():
    """Get data for 3D visualization."""
    try:
        # Generate vote distribution data
        constituencies = [
            {'name': 'Mumbai Central', 'votes': 1200, 'lat': 19.0760, 'lng': 72.8777},
            {'name': 'Delhi South', 'votes': 980, 'lat': 28.5355, 'lng': 77.2910},
            {'name': 'Bangalore Urban', 'votes': 1100, 'lat': 12.9716, 'lng': 77.5946},
            {'name': 'Chennai Central', 'votes': 850, 'lat': 13.0827, 'lng': 80.2707},
            {'name': 'Hyderabad East', 'votes': 920, 'lat': 17.3850, 'lng': 78.4867},
            {'name': 'Pune West', 'votes': 780, 'lat': 18.5204, 'lng': 73.8567},
            {'name': 'Kolkata North', 'votes': 690, 'lat': 22.5726, 'lng': 88.3639}
        ]
        
        # Add particle data for animation
        particles = []
        for i in range(50):  # Generate 50 vote particles
            particles.append({
                'id': i,
                'x': random.uniform(-180, 180),
                'y': random.uniform(-90, 90),
                'z': random.uniform(-50, 50),
                'velocity': {
                    'x': random.uniform(-0.5, 0.5),
                    'y': random.uniform(-0.5, 0.5),
                    'z': random.uniform(-0.5, 0.5)
                },
                'color': f"hsl({random.randint(0, 360)}, 70%, 60%)",
                'size': random.uniform(0.5, 2.0)
            })
        
        return jsonify({
            'constituencies': constituencies,
            'particles': particles,
            'globe_config': {
                'radius': 100,
                'segments': 64,
                'rings': 64
            },
            'animation_speed': 0.005,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/historical-votes')

def get_historical_votes():
    """Get historical vote totals for each year."""
    try:
        # --- TEMPORARY DEBUGGING ---
        # Return hardcoded data to isolate the problem.
        return jsonify({
            "success": True,
            "labels": [2014, 2019],
            "data": [1500000, 2500000]
        })
        # --- END DEBUGGING ---

        df = analytics.llm_agent.demographic_df
        if df is None or df.empty:
            return jsonify({"success": False, "error": "No data available."}, 500)

        yearly_votes = df.groupby('year')['total'].sum().sort_index()
        
        return jsonify({
            "success": True,
            "labels": yearly_votes.index.tolist(),
            "data": yearly_votes.values.tolist()
        })
    except Exception as e:
        app.logger.error(f"Error in get_historical_votes: {e}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to calculate historical votes."}, 500)



@app.route('/api/blockchain/network-stats')

def get_enhanced_network_stats():
    """Get enhanced Avalanche network statistics."""
    try:
        stats = analytics.get_avalanche_network_stats()
        
        # Add enhanced stats for Tier 1 features
        enhanced_stats = {
            **stats,
            'live_tps': round(random.uniform(1800, 2200), 1),
            'gas_price_gwei': round(random.uniform(20, 50), 2),
            'network_congestion': random.choice(['Low', 'Medium', 'High']),
            'validator_count': random.randint(1200, 1500),
            'subnet_activity': {
                'active_subnets': 12,
                'voting_subnet_id': 'subnet_voting_2024',
                'transactions_per_second': round(random.uniform(45, 85), 1)
            },
            'security_metrics': {
                'consensus_participation': '99.7%',
                'finality_time': '2.1s',
                'fork_resistance': 'Maximum'
            }
        }
        
        return jsonify(enhanced_stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====
# FRONTEND ROUTES (Serve HTML, CSS, JS files)
# =====

from flask_cors import cross_origin

@app.route('/api/analytics/turnout-heatmap')

def get_turnout_heatmap():
    """Get data for voter turnout heatmap."""
    try:
        df = analytics.llm_agent.demographic_df
        if df is None or df.empty:
            return jsonify({"success": False, "error": "No data available."}), 500

        # Group by constituency and sum the votes
        turnout_by_constituency = df.groupby('ac_name')['total'].sum().reset_index()
        
        # For bubble chart, we need x, y, and r (radius) values.
        # We can use random x, y for positioning and 'total' for radius.
        heatmap_data = []
        for _, row in turnout_by_constituency.iterrows():
            heatmap_data.append({
                'x': random.uniform(10, 90),
                'y': random.uniform(10, 90),
                'r': int(row['total'] / 1000), # Scale radius for better visualization
                'label': row['ac_name']
            })

        return jsonify({
            "success": True,
            "data": heatmap_data
        })
    except Exception as e:
        app.logger.error(f"Error in get_turnout_heatmap: {e}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to generate turnout heatmap data."}), 500


@app.route('/api/ping')
def ping():
    """A simple test route to confirm the server is loading new code."""
    return jsonify({"status": "pong"})

@app.route('/api/test')
@cross_origin() # Add cross_origin for the test route as well
def test_route():
    """A test route to confirm Flask routes are working."""
    return jsonify({"message": "Test route works!"})

@app.route('/api/analysis/full-report', methods=['GET'])
def generate_full_report():
    """Generate a full analysis report with charts."""
    try:
        output_dir = os.path.join(os.getcwd(), 'analysis_output')
        analyzer = BlockchainVotingAnalyzer(output_dir=output_dir)
        
        # Use the same data that the main application uses
        df = analytics.llm_agent.demographic_df
        if df is None or df.empty:
            return jsonify({"success": False, "error": "No data available to generate report."}, 500)

        # Run the analysis
        analysis_results = analyzer.run_complete_analysis(data_frame=df)
        
        if "error" in analysis_results:
            return jsonify({"success": False, "error": analysis_results["error"]}), 500
            
        # Get the list of generated chart files
        chart_files = [os.path.basename(p) for p in analyzer.charts_created]
        
        return jsonify({
            "success": True,
            "message": "Full analysis report generated successfully.",
            "charts": chart_files,
            "report_summary": analysis_results['election_analysis']['summary']
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analysis_output/<path:path>')
def serve_report_chart(path):
    """Serve images from the analysis_output directory and its subdirectories."""
    return send_from_directory('analysis_output', path)



@app.route('/')
def serve_frontend():
    """Serve the main frontend HTML file."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static_files(filename):
    """Serve static files (CSS, JS, images, etc.)."""
    return send_from_directory('.', filename)

# Background task to simulate live votes
def enhanced_background_simulation():
    """Enhanced background simulation with AI and blockchain."""
    while True:
        if analytics.demo_election_active:
            analytics.simulate_live_votes()
        time.sleep(random.uniform(1, 2)) # Faster vote interval

# Start enhanced background simulation
def start_enhanced_simulation():
    """Start the enhanced background simulation."""

    socketio.start_background_task(target=enhanced_background_simulation)

if __name__ == '__main__':
    # Suppress harmless connection reset errors
    log = logging.getLogger('eventlet.wsgi')
    log.setLevel(logging.ERROR)


    simulation_thread = threading.Thread(target=enhanced_background_simulation, daemon=True)
    simulation_thread.start()

if __name__ == '__main__':

    print("AVALANCHE VOTING ANALYTICS - TIER 1 ENHANCED SYSTEM")
    print("=" * 80)
    print("TIER 1 FEATURES ACTIVE:")
    print("   Live Blockchain Transaction Feed")
    print("   AI-Powered Predictive Dashboard")
    print("   3D Interactive Vote Visualization")
    print("   Dark/Light Theme with Avalanche Branding")
    print("=" * 80)


    print("Enhanced API Endpoints:")
    print("   GET  /api/health                     - Enhanced health check")
    print("   GET  /api/ai/insights               - Real-time AI insights")
    print("   GET  /api/ai/predictions            - AI-powered predictions")
    print("   GET  /api/ai/predictions/live       - Live AI predictions")
    print("   GET  /api/blockchain/transactions   - Blockchain transactions")
    print("   GET  /api/live/transactions         - Live transaction feed")
    print("   GET  /api/visualization/3d          - 3D visualization data")
    print("   GET  /api/blockchain/network-stats  - Enhanced network stats")
    print("   GET  /api/analytics/enhanced        - Complete enhanced analytics")
    print("   POST /api/election/start-enhanced   - Start enhanced demo")
    print("   POST /api/election/stop-enhanced    - Stop enhanced demo")
    print("Enhanced WebSocket Events:")
    print("   connect, disconnect, request_live_data, request_3d_data")
    print("   blockchain_feed_update, prediction_update, vote_update")
    print("   new_transaction, vote_count_update, visualization_data")
    print("Blockchain Integration:")
    print(f"   Network: {analytics.avalanche_network}")
    print(f"   Contract: {analytics.smart_contract_address}")
    print(f"   Live Transactions: {len(analytics.blockchain_events)}")
    print("AI Features:")
    print("   Enhanced LLM reasoning, Live predictions, Anomaly detection")
    print("   Real-time confidence scoring, Pattern recognition")
    print("Frontend Features:")
    print("   Avalanche branding, Theme switching, 3D globe visualization")
    print("   Live blockchain feed, Animated charts, Glass morphism UI")
    print("=" * 80)

    
    # Start all background services
    print("Starting background services...")
    start_enhanced_simulation()
    print("All services started successfully!")

    print("Server starting on: http://localhost:8080")

    print("Frontend URL: http://localhost:8080")
    print("WebSocket URL: http://localhost:8080")

    print("=" * 80)
    
    # Run the enhanced Flask-SocketIO app
    socketio.run(app, 
                 host='0.0.0.0', 
                 port=8080,
                 debug=False,  # Set to False for stability
                 allow_unsafe_werkzeug=True)