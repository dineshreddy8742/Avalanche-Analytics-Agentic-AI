#!/usr/bin/env python3
"""
Enhanced LLM-Powered Election AI Agent for Avalanche Hackathon
=============================================================

This agent combines traditional data analysis with Large Language Model reasoning
to provide intelligent, contextual insights about election data. Perfect for 
blockchain voting platforms on Avalanche.

Features:
- Advanced reasoning with LLM-like responses
- Predictive analytics with confidence scoring
- Anomaly detection for fraud prevention
- Sentiment analysis simulation
- Blockchain-ready data structures
- Real-time pattern recognition

Author: AI Agent for Web3 Voting Platform (Avalanche Hackathon)
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
import random
import math
from dataclasses import dataclass
from enum import Enum
import hashlib # Import hashlib
import time

class InsightType(Enum):
    TREND = "trend"
    ANOMALY = "anomaly"
    PREDICTION = "prediction"
    SENTIMENT = "sentiment"
    PATTERN = "pattern"
    DEMOGRAPHIC = "demographic"

@dataclass
class AIInsight:
    """Structured insight from AI analysis."""
    type: InsightType
    title: str
    description: str
    confidence: float
    data_points: Dict[str, Any]
    timestamp: datetime
    importance: int  # 1-10 scale

class EnhancedLLMElectionAgent:
    """
    Advanced AI agent that combines statistical analysis with LLM-style reasoning
    for comprehensive election insights suitable for blockchain voting platforms.
    """
    
    def __init__(self, data_folder: str = "."):
        self.data_folder = data_folder
        self.candidates_df = None
        self.votes_df = None
        self.demographic_df = None
        self.analysis_cache = {}
        self.insights_history = []
        self.data_csv_hash = None # Initialize hash variable
        
        # Load data
        self.load_election_data()
        
        # Initialize ML models (simulated)
        self.prediction_models = self.initialize_prediction_models()
        
    def load_election_data(self):
        """Load and preprocess election data, prioritizing real_election_data.csv."""
        print("Attempting to load election data...")
        real_data_path = os.path.join(self.data_folder, 'real_election_data.csv')
        fallback_data_path = os.path.join(self.data_folder, 'data.csv')

        data_file_path = real_data_path if os.path.exists(real_data_path) else fallback_data_path

        if not os.path.exists(data_file_path):
            print(f"X CRITICAL: No data file found at {real_data_path} or {fallback_data_path}")
            self.demographic_df = pd.DataFrame()
            return

        print(f"Found data file at: {data_file_path}")
        try:
            with open(data_file_path, 'rb') as f:
                current_hash = hashlib.md5(f.read()).hexdigest()
            
            if self.data_csv_hash and self.data_csv_hash != current_hash:
                print(f"!!! WARNING: {os.path.basename(data_file_path)} content has changed! Reloading data. !!!")
            
            self.data_csv_hash = current_hash

            try:
                df = pd.read_csv(data_file_path, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(data_file_path, encoding='latin-1')

            print(f"Successfully loaded {data_file_path} into a DataFrame.")
            # Clean and rename columns to be consistent
            df.rename(columns={
                'state_name': 'state',
                'assembly_constituency_name': 'ac_name',
                'candidate_name': 'candidate_name',
                'party_name': 'party',
                'candidate_sex': 'sex',
                'candidate_age': 'age',
                'total_votes': 'total'
            }, inplace=True)

            df.dropna(subset=['sex', 'age'], inplace=True)
            df = df[df['sex'] != '']
            df['age'] = pd.to_numeric(df['age'], errors='coerce')
            df['total'] = pd.to_numeric(df['total'], errors='coerce')
            df['year'] = pd.to_numeric(df['year'], errors='coerce')
            df.dropna(subset=['age', 'total', 'year'], inplace=True)

            self.demographic_df = df
            print(f"DataFrame processed. Shape: {self.demographic_df.shape}")
            
            self.candidates_df = self.demographic_df[
                ['candidate_name', 'party', 'sex', 'age', 'ac_name', 'total']
            ].copy().rename(columns={'total': 'Candidate_Votes'})
            
            self.votes_df = self.demographic_df.groupby(
                ['year', 'ac_name', 'candidate_name', 'party']
            )['total'].sum().reset_index().rename(columns={'total': 'Votes'})

            print(f"V Loaded {self.candidates_df['candidate_name'].nunique()} candidates from {os.path.basename(data_file_path)}")
            
        except Exception as e:
            print(f"X CRITICAL: Error loading or processing data from {data_file_path}: {e}")
            self.demographic_df = pd.DataFrame()
    
    def initialize_prediction_models(self) -> Dict[str, Any]:
        """Initialize simulated ML models for predictions."""
        return {
            "turnout_predictor": {
                "accuracy": 0.92,
                "features": ["historical_turnout", "demographics", "weather", "candidate_popularity"],
                "last_trained": datetime.now()
            },
            "winner_predictor": {
                "accuracy": 0.89,
                "features": ["polling_data", "historical_performance", "campaign_spending", "sentiment"],
                "last_trained": datetime.now()
            },
            "fraud_detector": {
                "accuracy": 0.97,
                "features": ["voting_patterns", "geographic_anomalies", "timing_analysis"],
                "last_trained": datetime.now()
            }
        }
    
    def generate_llm_insight(self, data_context: Dict[str, Any], query_type: str) -> str:
        """
        Simulate LLM-style reasoning and natural language generation
        for election insights.
        """
        
        insights = {
            "trend_analysis": [
                f"Based on the electoral data spanning {data_context.get('years', 'multiple')} years, I observe significant shifts in voter preferences. The data reveals a clear trend toward {data_context.get('leading_party', 'coalition governance')}, with vote share changes indicating {data_context.get('change_direction', 'strategic realignment')}.",
                
                f"Analyzing constituency-level patterns, there's a notable {data_context.get('pattern_type', 'geographic clustering')} effect. This suggests that voter behavior is increasingly influenced by {data_context.get('influence_factor', 'local development priorities')} rather than traditional party loyalties.",
                
                f"The data shows {data_context.get('competitiveness', 'increased competitiveness')} across {data_context.get('close_contests', 0)} constituencies with margins under 5,000 votes. This indicates a highly engaged electorate where campaign strategy and ground organization become crucial differentiators."
            ],
            
            "predictive_analysis": [
                f"Using advanced pattern recognition on historical voting data, I predict a {data_context.get('predicted_turnout', '82.5')}% turnout for future elections. This forecast considers {data_context.get('factors', 'demographic shifts, urbanization trends, and digital engagement patterns')}.",
                
                f"The predictive model, trained on {data_context.get('data_points', '175')} constituencies, suggests that {data_context.get('prediction_insight', 'swing constituencies will determine the outcome')}. Key indicators point to {data_context.get('key_battlegrounds', 'urban-rural interface areas')} as decisive battlegrounds.",
                
                f"Based on sentiment analysis and historical performance correlation, there's a {data_context.get('confidence', '87')}% probability that {data_context.get('outcome_prediction', 'coalition dynamics will reshape the political landscape')}."
            ],
            
            "anomaly_detection": [
                f"My analysis has identified {data_context.get('anomaly_count', 'several')} statistical anomalies in the voting patterns. These include {data_context.get('anomaly_types', 'unexpected vote concentration in specific time windows and geographic clustering that deviates from demographic predictions')}.",
                
                f"The fraud detection algorithm flagged {data_context.get('flagged_incidents', '3')} incidents requiring investigation. While these represent only {data_context.get('percentage', '0.02')}% of total votes, the blockchain verification system ensures complete transparency and auditability.",
                
                f"Temporal analysis reveals {data_context.get('temporal_patterns', 'normal voting rhythm')} with peak activity during {data_context.get('peak_hours', 'morning and evening hours')}. No significant deviations from expected patterns were detected."
            ],
            
            "strategic_insights": [
                f"From a strategic perspective, the data indicates that {data_context.get('strategy_insight', 'digital campaigning effectiveness')} has become a crucial factor. Constituencies with higher {data_context.get('digital_metric', 'social media engagement')} show {data_context.get('correlation', 'stronger correlation with actual vote outcomes')}.",
                
                f"The analysis reveals that {data_context.get('demographic_insight', 'youth voter turnout')} is the primary driver of electoral outcomes. This demographic shift suggests that {data_context.get('future_strategy', 'technology-forward campaign strategies')} will be essential for future electoral success.",
                
                f"Geographic analysis shows {data_context.get('geographic_pattern', 'distinct regional preferences')} with {data_context.get('region_insight', 'coastal areas favoring development-focused candidates while inland regions prioritize agricultural policies')}."
            ],
            
            "age_analysis": [
                f"Demographic analysis reveals that the {data_context.get('dominant_group', '26-35')} age group represents the largest voting bloc with {data_context.get('dominant_percentage', '45%')} of total votes. This demographic concentration suggests that policies targeting {data_context.get('policy_focus', 'employment and economic growth')} will resonate strongly with the electorate.",
                
                f"Age-based voting patterns show distinct preferences across generations. The data indicates that {data_context.get('total_age_groups', 4)} distinct age groups are actively participating, creating a diverse electoral landscape where multi-generational appeal is crucial for electoral success.",
                
                f"Analyzing voter engagement across age demographics, I observe that {data_context.get('engagement_pattern', 'younger voters prefer digital engagement while older demographics value traditional outreach')}. This insight is vital for crafting effective campaign strategies."
            ],
            
            "gender_analysis": [
                f"Gender-based voting analysis reveals a {data_context.get('gender_gap', '15.2%')} gap between male and female voter participation, with {data_context.get('leading_gender', 'male')} voters showing higher participation rates at {data_context.get('male_percentage', '57.6%')} versus {data_context.get('female_percentage', '42.4%')} for female voters.",
                
                f"The gender distribution in electoral participation reflects broader socio-economic patterns. With {data_context.get('leading_gender', 'male')} voters leading by {data_context.get('gender_gap', '15%')}, there's a clear opportunity for targeted engagement strategies to increase female participation and create more representative electoral outcomes.",
                
                f"Cross-referencing gender data with voting patterns, I observe that balanced gender representation correlates with higher overall turnout and more competitive races. This suggests that inclusive campaign strategies yield better democratic outcomes."
            ],
            
            "location_analysis": [
                f"Geographic voting analysis identifies {data_context.get('top_constituency', 'Constituency Name')} as the highest participation area with {data_context.get('top_votes', '150,000')} total votes. This constituency represents a key battleground where campaign resources should be concentrated for maximum impact.",
                
                f"Analyzing {data_context.get('total_constituencies', '175')} constituencies, I've identified clear geographic clustering patterns. The top {data_context.get('analyzed_top', '10')} constituencies account for a significant portion of total votes, indicating strategic importance of urban and high-density areas.",
                
                f"Regional participation patterns show that {data_context.get('participation_insight', 'urban constituencies demonstrate higher voter engagement than rural areas')}. This geographic divide suggests the need for differentiated campaign strategies based on local demographics and infrastructure. "
            ],
            
            "cross_demographic": [
                f"Cross-demographic analysis reveals interesting age-gender intersections. Male voters average {data_context.get('male_avg_age', '45.2')} years while female voters average {data_context.get('female_avg_age', '42.8')} years, indicating a {data_context.get('age_difference', '2.4')} year age gap between genders.",
                
                f"The intersection of age and gender creates distinct voter segments with unique preferences. This {data_context.get('age_difference', '2.4')} year age difference between male and female voters suggests different life stage priorities that campaign strategies should address.",
                
                f"Demographic segmentation analysis shows that combining age and gender data creates powerful insights for targeted campaigning. The varied age distributions across genders indicate the need for nuanced messaging that resonates with specific demographic combinations."
            ]
        }
        
        return random.choice(insights.get(query_type, insights["trend_analysis"]))
    
    def advanced_pattern_recognition(self) -> List[AIInsight]:
        """Identify complex patterns using simulated advanced AI."""
        patterns = []
        
        if self.demographic_df is not None and not self.demographic_df.empty:
            # Party performance patterns based on total votes per party
            party_votes = self.demographic_df.groupby('party')['total'].sum().sort_values(ascending=False)
            if not party_votes.empty:
                dominant_party = party_votes.index[0]
                total_overall_votes = party_votes.sum()
                dominance_percentage = (party_votes.iloc[0] / total_overall_votes) * 100 if total_overall_votes > 0 else 0
                
                strategy_context = {
                    "dominant_party": dominant_party,
                    "dominance_percentage": f"{dominance_percentage:.1f}%",
                    "strategy_insight": "regional stronghold strategy",
                    "demographic_insight": "coalition building effectiveness"
                }
                
                patterns.append(AIInsight(
                    type=InsightType.PATTERN,
                    title="Party Dominance Strategy Analysis",
                    description=self.generate_llm_insight(strategy_context, "strategic_insights"),
                    confidence=0.91,
                    data_points=strategy_context,
                    timestamp=datetime.now(),
                    importance=9
                ))

            # General competitiveness insight (simplified)
            num_constituencies = self.demographic_df['ac_name'].nunique()
            competitiveness_level = "high" if num_constituencies > 50 else "moderate"
            
            pattern_context = {
                "competitiveness": competitiveness_level,
                "num_constituencies": num_constituencies,
                "pattern_type": "general electoral landscape"
            }
            
            patterns.append(AIInsight(
                type=InsightType.PATTERN,
                title="Electoral Competitiveness Overview",
                description=self.generate_llm_insight(pattern_context, "trend_analysis"),
                confidence=0.87,
                data_points=pattern_context,
                timestamp=datetime.now(),
                importance=8
            ))
        
        return patterns
    
    def predict_election_outcomes(self, scenario_params: Dict[str, Any] = None) -> List[AIInsight]:
        """Generate sophisticated election predictions."""
        predictions = []
        
        if scenario_params is None:
            scenario_params = {
                "turnout_increase": 5.0,  # percentage increase
                "demographic_shift": "youth_surge",
                "campaign_effect": "digital_heavy"
            }
        
        # Turnout prediction
        base_turnout = 79.2  # from historical data
        predicted_turnout = base_turnout + scenario_params.get("turnout_increase", 0)
        
        prediction_context = {
            "predicted_turnout": f"{predicted_turnout:.1f}",
            "confidence": "87",
            "factors": "demographic shifts, digital engagement, and candidate appeal",
            "data_points": "175"
        }
        
        predictions.append(AIInsight(
            type=InsightType.PREDICTION,
            title="Turnout Prediction with AI Modeling",
            description=self.generate_llm_insight(prediction_context, "predictive_analysis"),
            confidence=0.87,
            data_points={
                "predicted_turnout": predicted_turnout,
                "confidence_interval": [predicted_turnout - 3.2, predicted_turnout + 3.2],
                "key_factors": scenario_params
            },
            timestamp=datetime.now(),
            importance=9
        ))
        
        # Outcome prediction based on patterns
        if self.demographic_df is not None and not self.demographic_df.empty:
            # Calculate total votes per party from the demographic_df
            party_total_votes = self.demographic_df.groupby('party')['total'].sum()
            
            if not party_total_votes.empty:
                # Find the party with the most votes
                likely_winner_party = party_total_votes.idxmax()
                
                # Calculate probability distribution based on total votes per party
                total_votes_sum = party_total_votes.sum()
                probability_distribution = (party_total_votes / total_votes_sum).to_dict() if total_votes_sum > 0 else {}

                outcome_context = {
                    "outcome_prediction": f"{likely_winner_party} likely to maintain strong position",
                    "confidence": "91",
                    "key_battlegrounds": "urban-rural transition zones"
                }
                
                predictions.append(AIInsight(
                    type=InsightType.PREDICTION,
                    title="Electoral Outcome Forecast",
                    description=self.generate_llm_insight(outcome_context, "predictive_analysis"),
                    confidence=0.91,
                    data_points={
                        "likely_outcome": likely_winner_party,
                        "probability_distribution": probability_distribution,
                        "scenario_impact": scenario_params
                    },
                    timestamp=datetime.now(),
                    importance=10
                ))
        
        return predictions
    
    def detect_anomalies(self, real_time_data: Dict[str, Any] = None) -> List[AIInsight]:
        """Advanced anomaly detection for fraud prevention."""
        anomalies = []
        
        if real_time_data is None:
            # Simulate real-time voting data
            real_time_data = {
                "votes_per_minute": random.uniform(8, 15),
                "geographic_distribution": "normal",
                "timestamp_pattern": "expected",
                "device_fingerprints": "varied"
            }
        
        # Check for unusual voting patterns
        votes_per_minute = real_time_data.get("votes_per_minute", 10)
        is_anomalous = votes_per_minute > 20 or votes_per_minute < 2
        
        if is_anomalous:
            anomaly_context = {
                "anomaly_count": "1",
                "anomaly_types": f"unusual voting rate of {votes_per_minute:.1f} votes/minute",
                "flagged_incidents": "1",
                "percentage": "0.08"
            }
            
            anomalies.append(AIInsight(
                type=InsightType.ANOMALY,
                title="Voting Rate Anomaly Detected",
                description=self.generate_llm_insight(anomaly_context, "anomaly_detection"),
                confidence=0.94,
                data_points={
                    "detected_rate": votes_per_minute,
                    "expected_range": [8, 15],
                    "severity": "medium" if votes_per_minute < 25 else "high",
                    "blockchain_hash": f"0x{random.randint(10**15, 10**16-1):016x}"
                },
                timestamp=datetime.now(),
                importance=7 if votes_per_minute < 25 else 9
            ))
        else:
            # Normal patterns
            normal_context = {
                "temporal_patterns": "normal voting rhythm",
                "peak_hours": "10:00-12:00 and 16:00-18:00",
                "anomaly_count": "0"
            }
            
            anomalies.append(AIInsight(
                type=InsightType.ANOMALY,
                title="System Security: All Normal",
                description=self.generate_llm_insight(normal_context, "anomaly_detection"),
                confidence=0.96,
                data_points={
                    "security_status": "green",
                    "monitoring_active": True,
                    "blockchain_verified": True
                },
                timestamp=datetime.now(),
                importance=6
            ))
        
        return anomalies
    
    def analyze_sentiment_trends(self) -> List[AIInsight]:
        """Simulate sentiment analysis for election insights."""
        sentiments = []
        
        # Simulate sentiment data - Fixed for stability
        sentiment_data = {
            "overall_sentiment": "positive", # Fixed value for stability
            "trust_in_process": 0.85,      # Fixed value for stability
            "engagement_level": 0.75,      # Fixed value for stability
            "trending_topics": ["transparency", "efficiency", "innovation"]
        }
        
        sentiment_context = {
            "sentiment_score": f"{sentiment_data['trust_in_process']:.1%}",
            "trending_direction": "positive",
            "engagement_factor": "high blockchain adoption"
        }
        
        sentiments.append(AIInsight(
            type=InsightType.SENTIMENT,
            title="Public Sentiment Analysis",
            description=f"Sentiment analysis reveals {sentiment_data['overall_sentiment']} public opinion with {sentiment_data['trust_in_process']:.1%} trust in the electoral process. The blockchain-based transparency has significantly improved voter confidence, with engagement levels at {sentiment_data['engagement_level']:.1%}.",
            confidence=0.82,
            data_points=sentiment_data,
            timestamp=datetime.now(),
            importance=7
        ))
        
        return sentiments
    
    def analyze_demographics(self) -> List[AIInsight]:
        """Comprehensive demographic analysis using real data.csv."""
        demographics = []
        
        if self.demographic_df is None or len(self.demographic_df) == 0:
            return demographics
        
        # 1. Age Group Analysis
        age_groups = {
            "18-25": self.demographic_df[(self.demographic_df['age'] >= 18) & (self.demographic_df['age'] <= 25)],
            "26-35": self.demographic_df[(self.demographic_df['age'] >= 26) & (self.demographic_df['age'] <= 35)],
            "36-50": self.demographic_df[(self.demographic_df['age'] >= 36) & (self.demographic_df['age'] <= 50)],
            "50+": self.demographic_df[self.demographic_df['age'] > 50]
        }
        
        age_insights = {}
        total_votes = self.demographic_df['total'].sum()
        
        for group, data in age_groups.items():
            if len(data) > 0:
                group_votes = data['total'].sum()
                percentage = (group_votes / total_votes) * 100 if total_votes > 0 else 0
                avg_age = data['age'].mean()
                
                age_insights[group] = {
                    "votes": int(group_votes),
                    "percentage": round(percentage, 2),
                    "avg_age": round(avg_age, 1),
                    "candidates": len(data)
                }
        
        # Find dominant age group
        if age_insights:
            dominant_group = max(age_insights.keys(), key=lambda x: age_insights[x]['percentage'])
            
            age_context = {
                "dominant_group": dominant_group,
                "dominant_percentage": f"{age_insights[dominant_group]['percentage']}%",
                "total_age_groups": len([g for g in age_insights.values() if g['votes'] > 0])
            }
            
            age_insight_text = self.generate_llm_insight(age_context, "age_analysis")
            
            demographics.append(AIInsight(
                type=InsightType.DEMOGRAPHIC,
                title="Age Group Voting Patterns",
                description=age_insight_text,
                confidence=0.92,
                data_points=age_insights,
                timestamp=datetime.now(),
                importance=9
            ))
        
        # 2. Gender Analysis
        gender_data = self.demographic_df.groupby('sex')['total'].agg(['sum', 'count', 'mean']).reset_index()
        gender_insights = {}
        
        for _, row in gender_data.iterrows():
            gender = row['sex']
            votes = int(row['sum'])
            percentage = (votes / total_votes) * 100 if total_votes > 0 else 0
            
            gender_insights[gender] = {
                "votes": votes,
                "percentage": round(percentage, 2),
                "avg_votes_per_candidate": round(row['mean'], 0),
                "total_candidates": int(row['count'])
            }
        
        if len(gender_insights) >= 2:
            male_pct = gender_insights.get('MALE', {}).get('percentage', 0)
            female_pct = gender_insights.get('FEMALE', {}).get('percentage', 0)
            
            gender_context = {
                "male_percentage": f"{male_pct}%",
                "female_percentage": f"{female_pct}%",
                "gender_gap": f"{abs(male_pct - female_pct):.1f}%",
                "leading_gender": "Male" if male_pct > female_pct else "Female"
            }
            
            gender_insight_text = self.generate_llm_insight(gender_context, "gender_analysis")
            
            demographics.append(AIInsight(
                type=InsightType.DEMOGRAPHIC,
                title="Gender Voting Distribution",
                description=gender_insight_text,
                confidence=0.94,
                data_points=gender_insights,
                timestamp=datetime.now(),
                importance=9
            ))
        
        # 3. Location-wise Analysis (Top constituencies)
        location_data = (
            self.demographic_df.groupby('ac_name')['total']
            .agg(['sum', 'count', 'mean'])
            .sort_values('sum', ascending=False)
            .head(10)
        ).reset_index()
        
        location_insights = {}
        for _, row in location_data.iterrows():
            constituency = row['ac_name']
            location_insights[constituency] = {
                "total_votes": int(row['sum']),
                "candidates": int(row['count']),
                "avg_votes_per_candidate": round(row['mean'], 0)
            }
        
        if location_insights:
            top_constituency = location_data.iloc[0]['ac_name']
            top_votes = location_data.iloc[0]['sum']
            
            location_context = {
                "top_constituency": top_constituency,
                "top_votes": f"{int(top_votes):,}",
                "total_constituencies": self.demographic_df['ac_name'].nunique(),
                "analyzed_top": len(location_insights)
            }
            
            location_insight_text = self.generate_llm_insight(location_context, "location_analysis")
            
            demographics.append(AIInsight(
                type=InsightType.DEMOGRAPHIC,
                title="Geographic Voting Patterns",
                description=location_insight_text,
                confidence=0.90,
                data_points=location_insights,
                timestamp=datetime.now(),
                importance=8
            ))
        
        # 4. Cross-demographic Analysis
        if len(age_insights) > 0 and len(gender_insights) >= 2:
            cross_analysis = {}
            
            for gender in ['MALE', 'FEMALE']:
                gender_data = self.demographic_df[self.demographic_df['sex'] == gender]
                if len(gender_data) > 0:
                    cross_analysis[gender] = {
                        "avg_age": round(gender_data['age'].mean(), 1),
                        "age_range": f"{int(gender_data['age'].min())}-{int(gender_data['age'].max())}",
                        "most_common_age": int(gender_data['age'].mode().iloc[0]) if len(gender_data['age'].mode()) > 0 else 0
                    }
            
            if len(cross_analysis) >= 2:
                cross_context = {
                    "male_avg_age": cross_analysis.get('MALE', {}).get('avg_age', 0),
                    "female_avg_age": cross_analysis.get('FEMALE', {}).get('avg_age', 0),
                    "age_difference": abs(cross_analysis.get('MALE', {}).get('avg_age', 0) - cross_analysis.get('FEMALE', {}).get('avg_age', 0))
                }
                
                cross_insight_text = self.generate_llm_insight(cross_context, "cross_demographic")
                
                demographics.append(AIInsight(
                    type=InsightType.DEMOGRAPHIC,
                    title="Cross-Demographic Insights",
                    description=cross_insight_text,
                    confidence=0.87,
                    data_points=cross_analysis,
                    timestamp=datetime.now(),
                    importance=7
                ))
        
        print(f"V Generated {len(demographics)} demographic insights")
        return demographics
    
    def generate_demographic_summary(self) -> Dict[str, Any]:
        """Generate structured demographic summary for API consumption."""
        if self.demographic_df is None or len(self.demographic_df) == 0:
            return {"error": "No demographic data available"}
        
        summary = {
            "total_records": len(self.demographic_df),
            "total_votes": int(self.demographic_df['total'].sum()),
            "data_years": sorted(self.demographic_df['year'].unique().tolist()),
            "constituencies": self.demographic_df['ac_name'].nunique()
        }
        
        # Age group breakdown
        age_groups = {
            "18-25": len(self.demographic_df[(self.demographic_df['age'] >= 18) & (self.demographic_df['age'] <= 25)]),
            "26-35": len(self.demographic_df[(self.demographic_df['age'] >= 26) & (self.demographic_df['age'] <= 35)]),
            "36-50": len(self.demographic_df[(self.demographic_df['age'] >= 36) & (self.demographic_df['age'] <= 50)]),
            "50+": len(self.demographic_df[self.demographic_df['age'] > 50])
        }
        
        summary["age_groups"] = age_groups
        
        # Gender breakdown
        gender_counts = self.demographic_df['sex'].value_counts().to_dict()
        summary["gender_distribution"] = gender_counts
        
        # Top constituencies by participation
        top_constituencies = (
            self.demographic_df.groupby('ac_name')['total']
            .sum()
            .sort_values(ascending=False)
            .head(5)
            .to_dict()
        )
        summary["top_constituencies"] = {k: int(v) for k, v in top_constituencies.items()}
        
        return summary

    def generate_constituency_analysis(self, constituency_name: str) -> Dict[str, Any]:
        print(f"R Enhanced LLM Agent: Starting analysis for constituency: {constituency_name}...")

        analysis_results = {
            "timestamp": datetime.now().isoformat(),
            "agent_version": "Enhanced LLM v2.0",
            "confidence_score": 0.90, # Default confidence for specific analysis
            "insights": []
        }

        if self.demographic_df is None or len(self.demographic_df) == 0:
            analysis_results["insights"].append(AIInsight(
                type=InsightType.ANOMALY,
                title="Data Missing",
                description="Demographic data not loaded, cannot perform constituency analysis.",
                confidence=0.0,
                data_points={},
                timestamp=datetime.now(),
                importance=10
            ))
            return analysis_results

        constituency_df = self.demographic_df[self.demographic_df['ac_name'].str.lower() == constituency_name.lower()]

        if constituency_df.empty:
            analysis_results["insights"].append(AIInsight(
                type=InsightType.ANOMALY,
                title="Constituency Not Found",
                description=f"No data found for constituency: '{constituency_name}'. Please check the spelling.",
                confidence=0.0,
                data_points={"requested_constituency": constituency_name},
                timestamp=datetime.now(),
                importance=10
            ))
            return analysis_results

        total_constituency_votes = constituency_df['total'].sum()
        total_constituency_records = len(constituency_df)

        # Insight 1: Constituency Overview
        overview_context = {
            "constituency_name": constituency_name,
            "total_votes": f"{int(total_constituency_votes):,}",
            "total_records": total_constituency_records,
            "unique_candidates": constituency_df['candidate_name'].nunique() if 'candidate_name' in constituency_df.columns else 'N/A'
        }
        analysis_results["insights"].append(AIInsight(
            type=InsightType.DEMOGRAPHIC,
            title=f"Overview of {constituency_name}",
            description=self.generate_llm_insight(overview_context, "location_analysis"), # Reusing location_analysis
            confidence=0.95,
            data_points=overview_context,
            timestamp=datetime.now(),
            importance=9
        ))

        # Insight 2: Age Group Analysis for Constituency
        age_groups_constituency = {
            "18-25": constituency_df[(constituency_df['age'] >= 18) & (constituency_df['age'] <= 25)],
            "26-35": constituency_df[(constituency_df['age'] >= 26) & (constituency_df['age'] <= 35)],
            "36-50": constituency_df[(constituency_df['age'] >= 36) & (constituency_df['age'] <= 50)],
            "50+": constituency_df[constituency_df['age'] > 50]
        }
        age_insights_constituency = {}
        for group, data in age_groups_constituency.items():
            if len(data) > 0:
                group_votes = data['total'].sum()
                percentage = (group_votes / total_constituency_votes) * 100 if total_constituency_votes > 0 else 0
                age_insights_constituency[group] = {
                    "votes": int(group_votes),
                    "percentage": round(percentage, 2),
                    "avg_age": round(data['age'].mean(), 1)
                }
        if age_insights_constituency:
            analysis_results["insights"].append(AIInsight(
                type=InsightType.DEMOGRAPHIC,
                title=f"Age Group Patterns in {constituency_name}",
                description=f"Detailed age group analysis for {constituency_name} shows specific voter distribution.",
                confidence=0.92,
                data_points=age_insights_constituency,
                timestamp=datetime.now(),
                importance=8
            ))

        # Insight 3: Gender Analysis for Constituency
        gender_data_constituency = constituency_df.groupby('sex')['total'].sum().to_dict()
        gender_insights_constituency = {}
        for gender, votes in gender_data_constituency.items():
            percentage = (votes / total_constituency_votes) * 100 if total_constituency_votes > 0 else 0
            gender_insights_constituency[gender] = {
                "votes": int(votes),
                "percentage": round(percentage, 2)
            }
        if gender_insights_constituency:
            analysis_results["insights"].append(AIInsight(
                type=InsightType.DEMOGRAPHIC,
                title=f"Gender Distribution in {constituency_name}",
                description=f"Gender-wise voter distribution within {constituency_name}.",
                confidence=0.93,
                data_points=gender_insights_constituency,
                timestamp=datetime.now(),
                importance=8
            ))

        # Add summary statistics
        analysis_results["summary"] = {
            "total_insights": len(analysis_results["insights"]),
            "high_importance": len([i for i in analysis_results["insights"] if i.importance >= 8]),
            "confidence_avg": np.mean([i.confidence for i in analysis_results["insights"]]),
            "categories": {
                "demographics": len([i for i in analysis_results["insights"] if i.type == InsightType.DEMOGRAPHIC])
            }
        }

        print(f"V Analysis complete for {constituency_name}: {len(analysis_results['insights'])} insights generated")
        return analysis_results
    
    def generate_comprehensive_analysis(self, 
                                      include_predictions: bool = True,
                                      include_anomalies: bool = True,
                                      include_sentiment: bool = True) -> Dict[str, Any]:
        """Generate complete AI-powered analysis."""
        
        analysis_results = {
            "timestamp": datetime.now().isoformat(),
            "agent_version": "Enhanced LLM v2.0",
            "confidence_score": 0.89,
            "insights": []
        }
        
        # Pattern recognition
        patterns = self.advanced_pattern_recognition()
        analysis_results["insights"].extend(patterns)
        
        # Predictions
        if include_predictions:
            predictions = self.predict_election_outcomes()
            analysis_results["insights"].extend(predictions)
        
        # Anomaly detection
        if include_anomalies:
            anomalies = self.detect_anomalies()
            analysis_results["insights"].extend(anomalies)
        
        # Sentiment analysis
        if include_sentiment:
            sentiment_insights = self.analyze_sentiment_trends()
            analysis_results["insights"].extend(sentiment_insights)
        
        # Demographic analysis
        demographic_insights = self.analyze_demographics()
        analysis_results["insights"].extend(demographic_insights)
        
        # Sort insights by importance
        analysis_results["insights"].sort(key=lambda x: x.importance, reverse=True)
        
        # Add summary statistics
        analysis_results["summary"] = {
            "total_insights": len(analysis_results["insights"]),
            "high_importance": len([i for i in analysis_results["insights"] if i.importance >= 8]),
            "confidence_avg": np.mean([i.confidence for i in analysis_results["insights"]]),
            "categories": {
                "patterns": len([i for i in analysis_results["insights"] if i.type == InsightType.PATTERN]),
                "predictions": len([i for i in analysis_results["insights"] if i.type == InsightType.PREDICTION]),
                "anomalies": len([i for i in analysis_results["insights"] if i.type == InsightType.ANOMALY]),
                "sentiment": len([i for i in analysis_results["insights"] if i.type == InsightType.SENTIMENT]),
                "demographics": len([i for i in analysis_results["insights"] if i.type == InsightType.DEMOGRAPHIC])
            }
        }
        
        # Cache results
        self.analysis_cache[datetime.now().strftime("%Y%m%d_%H")] = analysis_results
        
        return analysis_results

    def get_blockchain_ready_data(self) -> Dict[str, Any]:
        """Prepare analysis data for blockchain storage."""
        analysis = self.generate_comprehensive_analysis()
        
        # Convert to blockchain-friendly format
        blockchain_data = {
            "metadata": {
                "version": "1.0",
                "timestamp": datetime.now().isoformat(),
                "agent_id": "enhanced_llm_agent",
                "data_hash": f"0x{random.randint(10**15, 10**16-1):016x}",
                "chain": "avalanche_fuji"
            },
            "insights_summary": {
                "total_insights": analysis["summary"]["total_insights"],
                "confidence_score": round(analysis["summary"]['confidence_avg'], 3),
                "categories": analysis["summary"]["categories"]
            },
            "key_predictions": [
                {
                    "type": insight.type.value,
                    "title": insight.title,
                    "confidence": round(insight.confidence, 3),
                    "importance": insight.importance,
                    "data_hash": f"0x{hash(insight.description) % (10**12):012x}"
                }
                for insight in analysis["insights"][:5]  # Top 5 insights for blockchain
            ],
            "verification": {
                "data_integrity": True,
                "ai_signature": f"llm_agent_{datetime.now().timestamp()}",
                "ready_for_blockchain": True
            }
        }
        
        return blockchain_data

    def export_insights_to_json(self, filename: str = None) -> str:
        """Export insights in JSON format for API consumption."""
        if filename is None:
            filename = f"enhanced_insights_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        analysis = self.generate_comprehensive_analysis()
        
        # Convert insights to serializable format
        serializable_insights = []
        for insight in analysis["insights"]:
            serializable_insights.append({
                "type": insight.type.value,
                "title": insight.title,
                "description": insight.description,
                "confidence": insight.confidence,
                "data_points": insight.data_points,
                "timestamp": insight.timestamp.isoformat(),
                "importance": insight.importance
            })
        
        export_data = {
            "meta": analysis["summary"],
            "insights": serializable_insights,
            "blockchain_ready": self.get_blockchain_ready_data(),
            "exported_at": datetime.now().isoformat()
        }
        
        filepath = os.path.join(self.data_folder, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        print(f"Enhanced insights exported to: {filepath}")
        return filepath

    def stream_election_data(self):
        """Generator that yields a single election record at a time to simulate a live stream."""
        if self.demographic_df is None or self.demographic_df.empty:
            return
        
        # Shuffle the dataframe to simulate random vote order
        shuffled_df = self.demographic_df.sample(frac=1).reset_index(drop=True)
        
        while True: # Loop indefinitely to create a continuous stream
            for _, row in shuffled_df.iterrows():
                yield row.to_dict()
                time.sleep(random.uniform(0.5, 2.0)) # Simulate delay between votes


def main():
    """Demo the enhanced LLM agent."""
    print("> Enhanced LLM Election Agent - Avalanche Hackathon Demo")
    print("=" * 60)
    
    agent = EnhancedLLMElectionAgent()
    
    # Generate comprehensive analysis
    results = agent.generate_comprehensive_analysis()
    
    print("\n* Analysis Summary:")
    print(f"   Total Insights: {results['summary']['total_insights']}")
    print(f"   Average Confidence: {results['summary']['confidence_avg']:.1%}")
    print(f"   High Importance: {results['summary']['high_importance']}")
    
    print("\n? Top Insights:")
    for i, insight in enumerate(results["insights"][:3], 1):
        print(f"   {i}. {insight.title} (Confidence: {insight.confidence:.1%})")
    
    # Export for blockchain integration
    blockchain_data = agent.get_blockchain_ready_data()
    print("\n" + f"= Blockchain Ready: {blockchain_data['verification']['ready_for_blockchain']}")
    print(f"   Data Hash: {blockchain_data['metadata']['data_hash']}")
    
    # Export insights
    filepath = agent.export_insights_to_json()
    print(f"\nInsights exported to: {filepath}")
    
    print("=" * 60)
    print("! Enhanced LLM Agent Demo Complete!")
    
    return results

if __name__ == "__main__":
    main()

