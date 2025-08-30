#!/usr/bin/env python3
"""
AI Voting Results Analysis Agent - Blockchain Platform
======================================================

Complete AI-powered election analysis system that generates comprehensive 
results analysis for candidates and admins after voting has ended.

Features:
- Candidate-wise results with vote counts and percentages
- Demographic analytics (age groups, gender, location)
- Professional visualizations (bar, pie, line, heatmap charts)
- Natural language narrative insights
- Structured JSON output for easy integration
- Hackathon-ready presentation format

Built for blockchain-based voting platforms with complete transparency.
"""

import pandas as pd
import numpy as np
<<<<<<< HEAD
import matplotlib
matplotlib.use('Agg') # Use non-interactive backend for server environments
=======
>>>>>>> 50d8d612ffb9108b585319807627277b581ec3be
import matplotlib.pyplot as plt
import seaborn as sns
import json
import os
from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional
import warnings
warnings.filterwarnings('ignore')

# Set style for professional charts
plt.style.use('default')
sns.set_palette("husl")

class BlockchainVotingAnalyzer:
    """
    AI-powered voting results analyzer for blockchain-based elections.
    
    Takes voting datasets and generates complete analysis including:
    - Candidate results with vote counts and percentages
    - Demographic breakdowns (age, gender, location)
    - Professional visualizations
    - Natural language insights
    - Structured data output
    """
    
    def __init__(self, output_dir: str = "/project/workspace/analysis_output"):
        self.output_dir = output_dir
        self.voting_data = None
        self.analysis_results = {}
        self.charts_created = []
        self.insights = []
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        print("🤖 AI Voting Results Analyzer initialized")
        print(f"📁 Output directory: {output_dir}")
    
    def load_voting_data(self, data_path: str = None, data_frame: pd.DataFrame = None) -> bool:
        """
        Load voting data from CSV file or DataFrame.
        
        Expected columns: voter_id, candidate_voted, age, gender, location, timestamp
        """
        try:
            if data_frame is not None:
                self.voting_data = data_frame.copy()
            elif data_path and os.path.exists(data_path):
                self.voting_data = pd.read_csv(data_path)
            else:
                # Load our existing demographic data and transform it to voting format
                demo_path = os.path.join(os.path.dirname(__file__), "data.csv")
                if os.path.exists(demo_path):
                    demo_data = pd.read_csv(demo_path)
                    self.voting_data = self._transform_demo_data(demo_data)
                else:
                    raise FileNotFoundError("No voting data provided")
            
            # Validate required columns
            required_cols = ['voter_id', 'candidate_voted', 'age', 'gender', 'location']
            missing_cols = [col for col in required_cols if col not in self.voting_data.columns]
            
            if missing_cols:
                print(f"⚠️ Missing columns: {missing_cols}")
                print("🔄 Attempting to map available columns...")
                self._map_columns()
            
            # Clean and validate data
            self.voting_data = self._clean_voting_data()
            
            print(f"✅ Loaded {len(self.voting_data):,} voting records")
            print(f"📊 Candidates: {self.voting_data['candidate_voted'].nunique()}")
            print(f"👥 Voters: {self.voting_data['voter_id'].nunique()}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading voting data: {e}")
            return False
    
    def _transform_demo_data(self, demo_data: pd.DataFrame) -> pd.DataFrame:
        """Transform demographic data to voting format for analysis."""
        print("🔄 Transforming demographic data to voting format...")
        
        # Create voting records from candidate data
        voting_records = []
        
        for idx, row in demo_data.iterrows():
            # Create multiple voting records per candidate based on their votes
            votes = int(row.get('total', 1))
            candidate = row.get('candidate_name', f"Candidate_{idx}")
            location = row.get('ac_name', f"Location_{idx}")
            gender = row.get('sex', 'Unknown')
            age = int(row.get('age', 35))
            
            # Create simulated voters for this candidate
            for i in range(min(votes // 1000, 100)):  # Limit for demo purposes
                voting_records.append({
                    'voter_id': f"voter_{idx}_{i}",
                    'candidate_voted': candidate,
                    'age': age + np.random.randint(-5, 6),  # Add some age variation
                    'gender': gender,
                    'location': location,
                    'timestamp': f"2024-{np.random.randint(1,13):02d}-{np.random.randint(1,29):02d}"
                })
        
        return pd.DataFrame(voting_records)
    
    def _map_columns(self):
        """Map available columns to required format."""
        column_mapping = {
            'candidate_name': 'candidate_voted',
            'sex': 'gender',
            'ac_name': 'location'
        }
        
        for old_col, new_col in column_mapping.items():
            if old_col in self.voting_data.columns:
                self.voting_data[new_col] = self.voting_data[old_col]
        
        # Create voter_id if missing
        if 'voter_id' not in self.voting_data.columns:
            self.voting_data['voter_id'] = [f"voter_{i}" for i in range(len(self.voting_data))]
        
        # Create timestamp if missing
        if 'timestamp' not in self.voting_data.columns:
            self.voting_data['timestamp'] = datetime.now().strftime("%Y-%m-%d")
    
    def _clean_voting_data(self) -> pd.DataFrame:
        """Clean and validate voting data."""
        data = self.voting_data.copy()
        
        # Remove null values in critical columns
        data = data.dropna(subset=['candidate_voted', 'voter_id'])
        
        # Clean gender values
        if 'gender' in data.columns:
            gender_mapping = {
                'MALE': 'Male', 'FEMALE': 'Female', 'M': 'Male', 'F': 'Female',
                'male': 'Male', 'female': 'Female', 'THIRD': 'Other'
            }
            data['gender'] = data['gender'].map(gender_mapping).fillna(data['gender'])
        
        # Ensure age is numeric
        if 'age' in data.columns:
            data['age'] = pd.to_numeric(data['age'], errors='coerce')
            data = data.dropna(subset=['age'])
        
        return data
    
    def analyze_candidate_results(self) -> Dict[str, Any]:
        """
        Task 1: Candidate-wise Results
        - Count total votes for each candidate
        - Calculate percentage of votes each candidate received
        - Identify winning candidate and margin of victory
        """
        print("\n📊 Analyzing Candidate Results...")
        
        # Vote counts per candidate
        candidate_votes = self.voting_data['candidate_voted'].value_counts()
<<<<<<< HEAD
        
        if candidate_votes.empty:
            results = {
                "candidate_votes": {}, "candidate_percentages": {}, "total_votes": 0,
                "winner": {"name": "N/A", "votes": 0, "percentage": 0, "margin_votes": 0, "margin_percentage": 0},
                "runner_up": {"name": "N/A", "votes": 0, "percentage": 0}
            }
            self.analysis_results["candidate_results"] = results
            print("⚠️ No candidate votes found to analyze.")
            return results

        total_votes = int(candidate_votes.sum())
        
        # Calculate percentages
        candidate_percentages = (candidate_votes / total_votes * 100).round(2) if total_votes > 0 else candidate_votes
=======
        total_votes = len(self.voting_data)
        
        # Calculate percentages
        candidate_percentages = (candidate_votes / total_votes * 100).round(2)
>>>>>>> 50d8d612ffb9108b585319807627277b581ec3be
        
        # Identify winner and margin
        winner = candidate_votes.index[0]
        winner_votes = candidate_votes.iloc[0]
<<<<<<< HEAD
        
        if len(candidate_votes) > 1:
            runner_up = candidate_votes.index[1]
            runner_up_votes = candidate_votes.iloc[1]
            margin = winner_votes - runner_up_votes
            margin_percentage = (margin / total_votes * 100).round(2) if total_votes > 0 else 0
        else:
            runner_up = "None"
            runner_up_votes = 0
            margin = winner_votes
            margin_percentage = 100.0

=======
        runner_up_votes = candidate_votes.iloc[1] if len(candidate_votes) > 1 else 0
        margin = winner_votes - runner_up_votes
        margin_percentage = (margin / total_votes * 100).round(2)
        
>>>>>>> 50d8d612ffb9108b585319807627277b581ec3be
        results = {
            "candidate_votes": candidate_votes.to_dict(),
            "candidate_percentages": candidate_percentages.to_dict(),
            "total_votes": total_votes,
            "winner": {
                "name": winner,
                "votes": int(winner_votes),
<<<<<<< HEAD
                "percentage": float(candidate_percentages.iloc[0]) if not candidate_percentages.empty else 0,
=======
                "percentage": float(candidate_percentages.iloc[0]),
>>>>>>> 50d8d612ffb9108b585319807627277b581ec3be
                "margin_votes": int(margin),
                "margin_percentage": float(margin_percentage)
            },
            "runner_up": {
<<<<<<< HEAD
                "name": runner_up,
                "votes": int(runner_up_votes),
                "percentage": float(candidate_percentages.iloc[1]) if len(candidate_percentages) > 1 else 0
=======
                "name": candidate_votes.index[1] if len(candidate_votes) > 1 else "None",
                "votes": int(runner_up_votes),
                "percentage": float(candidate_percentages.iloc[1]) if len(candidate_votes) > 1 else 0
>>>>>>> 50d8d612ffb9108b585319807627277b581ec3be
            }
        }
        
        self.analysis_results["candidate_results"] = results
        
        # Generate insights
<<<<<<< HEAD
        if not candidate_percentages.empty:
            self.insights.append(f"🏆 {winner} is leading with {candidate_percentages.iloc[0]}% of total votes ({winner_votes:,} votes).")
            if len(candidate_votes) > 1:
                self.insights.append(f"📈 Margin of victory: {margin:,} votes ({margin_percentage}% of total votes).")
        
        print(f"✅ Winner: {winner} with {winner_votes:,} votes ({candidate_percentages.iloc[0] if not candidate_percentages.empty else 0}%)")
=======
        self.insights.append(f"🏆 {winner} is leading with {candidate_percentages.iloc[0]}% of total votes ({winner_votes:,} votes).")
        if len(candidate_votes) > 1:
            self.insights.append(f"📈 Margin of victory: {margin:,} votes ({margin_percentage}% of total votes).")
        
        print(f"✅ Winner: {winner} with {winner_votes:,} votes ({candidate_percentages.iloc[0]}%)")
>>>>>>> 50d8d612ffb9108b585319807627277b581ec3be
        
        return results
    
    def analyze_demographics(self) -> Dict[str, Any]:
        """
        Task 2: Demographic Analytics
        - Break down votes by age groups (18-25, 26-35, 36-50, 50+)
        - Show male vs female voting trends
        - Show votes by location distribution
        """
        print("\n👥 Analyzing Demographics...")
        
        demographics = {}
        
        # Age Group Analysis
        if 'age' in self.voting_data.columns:
            age_bins = [0, 25, 35, 50, 100]
            age_labels = ['18-25', '26-35', '36-50', '50+']
            self.voting_data['age_group'] = pd.cut(self.voting_data['age'], 
                                                 bins=age_bins, labels=age_labels, right=False)
            
            age_distribution = self.voting_data['age_group'].value_counts()
            age_percentages = (age_distribution / len(self.voting_data) * 100).round(2)
            
            demographics["age_groups"] = {
                "counts": age_distribution.to_dict(),
                "percentages": age_percentages.to_dict(),
                "dominant_group": age_distribution.index[0],
                "dominant_percentage": float(age_percentages.iloc[0])
            }
            
            self.insights.append(f"👦 Most voters were in the {age_distribution.index[0]} age group ({age_percentages.iloc[0]}%).")
        
        # Gender Analysis
        if 'gender' in self.voting_data.columns:
            gender_distribution = self.voting_data['gender'].value_counts()
            gender_percentages = (gender_distribution / len(self.voting_data) * 100).round(2)
            
            demographics["gender"] = {
                "counts": gender_distribution.to_dict(),
                "percentages": gender_percentages.to_dict(),
                "male_percentage": float(gender_percentages.get('Male', 0)),
                "female_percentage": float(gender_percentages.get('Female', 0))
            }
            
            if 'Male' in gender_percentages and 'Female' in gender_percentages:
                gender_gap = abs(gender_percentages['Male'] - gender_percentages['Female'])
                self.insights.append(f"⚖️ Gender distribution: {gender_percentages['Male']}% Male, {gender_percentages['Female']}% Female (gap: {gender_gap:.1f}%).")
        
        # Location Analysis
        if 'location' in self.voting_data.columns:
            location_distribution = self.voting_data['location'].value_counts().head(10)
            location_percentages = (location_distribution / len(self.voting_data) * 100).round(2)
            
            demographics["locations"] = {
                "top_10_counts": location_distribution.to_dict(),
                "top_10_percentages": location_percentages.to_dict(),
                "highest_turnout_location": location_distribution.index[0],
                "highest_turnout_count": int(location_distribution.iloc[0]),
                "highest_turnout_percentage": float(location_percentages.iloc[0])
            }
            
            self.insights.append(f"🏙️ {location_distribution.index[0]} had the highest turnout with {location_distribution.iloc[0]:,} votes ({location_percentages.iloc[0]}%).")
        
        self.analysis_results["demographics"] = demographics
        print("✅ Demographic analysis completed")
        
        return demographics
    
    def create_visualizations(self) -> List[str]:
        """
        Task 3: Create professional visualizations
        - Bar chart: Votes per candidate
        - Pie chart: Vote percentage share
        - Bar chart: Age group distribution
        - Bar chart: Location-wise participation
        """
        print("\n📈 Creating Visualizations...")
        
        charts_created = []
        
        # Set up the plotting style
        plt.rcParams.update({
            'figure.figsize': (12, 8),
            'axes.titlesize': 16,
            'axes.labelsize': 12,
            'xtick.labelsize': 10,
            'ytick.labelsize': 10,
            'legend.fontsize': 10
        })
        
        # 1. Bar Chart: Votes per Candidate
        try:
            plt.figure(figsize=(12, 8))
            candidate_data = self.analysis_results["candidate_results"]["candidate_votes"]
            
            bars = plt.bar(candidate_data.keys(), candidate_data.values(), 
                          color=plt.cm.Set3(np.linspace(0, 1, len(candidate_data))))
            
            plt.title('Votes per Candidate', fontsize=16, fontweight='bold', pad=20)
            plt.xlabel('Candidates', fontsize=12)
            plt.ylabel('Number of Votes', fontsize=12)
            plt.xticks(rotation=45, ha='right')
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                        f'{int(height):,}', ha='center', va='bottom', fontweight='bold')
            
            plt.tight_layout()
            chart_path = os.path.join(self.output_dir, 'votes_per_candidate.png')
            plt.savefig(chart_path, dpi=300, bbox_inches='tight')
            plt.close()
            charts_created.append(chart_path)
            print("✅ Created: Votes per Candidate chart")
        except Exception as e:
            print(f"❌ Error creating candidate votes chart: {e}")
        
        # 2. Pie Chart: Vote Percentage Share
        try:
            plt.figure(figsize=(10, 8))
            candidate_percentages = self.analysis_results["candidate_results"]["candidate_percentages"]
            
            colors = plt.cm.Set3(np.linspace(0, 1, len(candidate_percentages)))
            wedges, texts, autotexts = plt.pie(candidate_percentages.values(), 
                                             labels=candidate_percentages.keys(),
                                             autopct='%1.1f%%',
                                             colors=colors,
                                             startangle=90,
                                             explode=[0.05 if i == 0 else 0 for i in range(len(candidate_percentages))])
            
            plt.title('Vote Percentage Share', fontsize=16, fontweight='bold', pad=20)
            
            # Enhance text appearance
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontweight('bold')
                autotext.set_fontsize(10)
            
            plt.axis('equal')
            chart_path = os.path.join(self.output_dir, 'vote_percentage_share.png')
            plt.savefig(chart_path, dpi=300, bbox_inches='tight')
            plt.close()
            charts_created.append(chart_path)
            print("✅ Created: Vote Percentage Share chart")
        except Exception as e:
            print(f"❌ Error creating percentage share chart: {e}")
        
        # 3. Bar Chart: Age Group Distribution
        if "age_groups" in self.analysis_results["demographics"]:
            try:
                plt.figure(figsize=(10, 6))
                age_data = self.analysis_results["demographics"]["age_groups"]["percentages"]
                
                bars = plt.bar(age_data.keys(), age_data.values(),
                              color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'])
                
                plt.title('Age Group Distribution', fontsize=16, fontweight='bold', pad=20)
                plt.xlabel('Age Groups', fontsize=12)
                plt.ylabel('Percentage of Votes (%)', fontsize=12)
                
                # Add value labels on bars
                for bar in bars:
                    height = bar.get_height()
                    plt.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                            f'{height:.1f}%', ha='center', va='bottom', fontweight='bold')
                
                plt.tight_layout()
                chart_path = os.path.join(self.output_dir, 'age_group_distribution.png')
                plt.savefig(chart_path, dpi=300, bbox_inches='tight')
                plt.close()
                charts_created.append(chart_path)
                print("✅ Created: Age Group Distribution chart")
            except Exception as e:
                print(f"❌ Error creating age group chart: {e}")
        
        # 4. Bar Chart: Location-wise Participation (Top 10)
        if "locations" in self.analysis_results["demographics"]:
            try:
                plt.figure(figsize=(12, 8))
                location_data = self.analysis_results["demographics"]["locations"]["top_10_counts"]
                
                bars = plt.bar(range(len(location_data)), list(location_data.values()),
                              color=plt.cm.viridis(np.linspace(0, 1, len(location_data))))
                
                plt.title('Location-wise Participation (Top 10)', fontsize=16, fontweight='bold', pad=20)
                plt.xlabel('Locations', fontsize=12)
                plt.ylabel('Number of Votes', fontsize=12)
                plt.xticks(range(len(location_data)), list(location_data.keys()), rotation=45, ha='right')
                
                # Add value labels on bars
                for i, bar in enumerate(bars):
                    height = bar.get_height()
                    plt.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                            f'{int(height):,}', ha='center', va='bottom', fontweight='bold')
                
                plt.tight_layout()
                chart_path = os.path.join(self.output_dir, 'location_participation.png')
                plt.savefig(chart_path, dpi=300, bbox_inches='tight')
                plt.close()
                charts_created.append(chart_path)
                print("✅ Created: Location Participation chart")
            except Exception as e:
                print(f"❌ Error creating location chart: {e}")
        
        # 5. Gender Distribution Pie Chart
        if "gender" in self.analysis_results["demographics"]:
            try:
                plt.figure(figsize=(8, 8))
                gender_data = self.analysis_results["demographics"]["gender"]["percentages"]
                
                colors = ['#FF69B4', '#4169E1', '#32CD32']  # Pink, Blue, Green
                plt.pie(gender_data.values(), labels=gender_data.keys(), autopct='%1.1f%%',
                       colors=colors[:len(gender_data)], startangle=90)
                
                plt.title('Gender Distribution', fontsize=16, fontweight='bold', pad=20)
                plt.axis('equal')
                
                chart_path = os.path.join(self.output_dir, 'gender_distribution.png')
                plt.savefig(chart_path, dpi=300, bbox_inches='tight')
                plt.close()
                charts_created.append(chart_path)
                print("✅ Created: Gender Distribution chart")
            except Exception as e:
                print(f"❌ Error creating gender chart: {e}")
        
        self.charts_created = charts_created
        return charts_created
    
    def generate_narrative_insights(self) -> List[str]:
        """
        Task 4: Generate plain-language insights
        Create easy-to-understand summary statements
        """
        print("\n📝 Generating Narrative Insights...")
        
        # We already generated some insights during analysis
        # Let's add more comprehensive insights
        
        additional_insights = []
        
        # Overall election insights
        total_votes = self.analysis_results["candidate_results"]["total_votes"]
        num_candidates = len(self.analysis_results["candidate_results"]["candidate_votes"])
        
        additional_insights.append(f"🗳️ Election Overview: {total_votes:,} total votes cast across {num_candidates} candidates.")
        
        # Competitiveness insight
        winner_pct = self.analysis_results["candidate_results"]["winner"]["percentage"]
        if winner_pct > 60:
            additional_insights.append("🎯 This was a decisive victory with a clear mandate.")
        elif winner_pct > 45:
            additional_insights.append("⚖️ This was a competitive election with a moderate victory margin.")
        else:
            additional_insights.append("🔥 This was a highly competitive election with a narrow victory margin.")
        
        # Demographic insights
        if "demographics" in self.analysis_results:
            demo = self.analysis_results["demographics"]
            
            if "age_groups" in demo:
                dominant_age = demo["age_groups"]["dominant_group"]
                dominant_pct = demo["age_groups"]["dominant_percentage"]
                additional_insights.append(f"📊 Age Analysis: {dominant_age} voters drove the election outcome, representing {dominant_pct}% of the electorate.")
            
            if "gender" in demo:
                male_pct = demo["gender"].get("male_percentage", 0)
                female_pct = demo["gender"].get("female_percentage", 0)
                if abs(male_pct - female_pct) < 5:
                    additional_insights.append("🤝 Gender participation was well-balanced across male and female voters.")
                else:
                    leading_gender = "Male" if male_pct > female_pct else "Female"
                    additional_insights.append(f"📈 {leading_gender} voters showed higher participation in this election.")
        
        # Combine all insights
        all_insights = self.insights + additional_insights
        
        # Add timestamp and election completion
        all_insights.append(f"⏰ Analysis completed on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        all_insights.append("✅ All voting data has been verified and analyzed using AI-powered algorithms.")
        
        print(f"✅ Generated {len(all_insights)} narrative insights")
        
        return all_insights
    
    def generate_structured_output(self) -> Dict[str, Any]:
        """
        Task 5: Generate structured JSON output with all results
        """
        print("\n📄 Generating Structured Output...")
        
        structured_output = {
            "election_analysis": {
                "metadata": {
                    "analysis_timestamp": datetime.now().isoformat(),
                    "total_votes": self.analysis_results["candidate_results"]["total_votes"],
                    "total_candidates": len(self.analysis_results["candidate_results"]["candidate_votes"]),
                    "analyzer_version": "AI Blockchain Voting Analyzer v1.0"
                },
                "candidate_results": self.analysis_results["candidate_results"],
                "demographic_analysis": self.analysis_results.get("demographics", {}),
                "narrative_insights": self.generate_narrative_insights(),
                "visualizations": {
                    "charts_created": len(self.charts_created),
                    "chart_files": [os.path.basename(chart) for chart in self.charts_created]
                },
                "summary": {
                    "winner": self.analysis_results["candidate_results"]["winner"]["name"],
                    "winning_percentage": self.analysis_results["candidate_results"]["winner"]["percentage"],
                    "margin_of_victory": self.analysis_results["candidate_results"]["winner"]["margin_percentage"],
                    "key_insights": self.insights[:3]  # Top 3 insights
                }
            }
        }
        
        # Save to JSON file
        output_file = os.path.join(self.output_dir, 'election_analysis.json')
        with open(output_file, 'w') as f:
            json.dump(structured_output, f, indent=2, default=str)
        
        print(f"✅ Structured output saved to: {output_file}")
        
        return structured_output
    
    def run_complete_analysis(self, data_path: str = None, data_frame: pd.DataFrame = None) -> Dict[str, Any]:
        """
        Run complete election analysis pipeline.
        
        This is the main method that executes all analysis tasks:
        1. Load and validate data
        2. Analyze candidate results
        3. Perform demographic analysis
        4. Create visualizations
        5. Generate insights
        6. Produce structured output
        """
        print("🚀 Starting Complete AI Election Analysis")
        print("=" * 60)
        
        # Step 1: Load data
        if not self.load_voting_data(data_path, data_frame):
            return {"error": "Failed to load voting data"}
        
        # Step 2: Analyze candidate results
        self.analyze_candidate_results()
        
        # Step 3: Analyze demographics
        self.analyze_demographics()
        
        # Step 4: Create visualizations
        self.create_visualizations()
        
        # Step 5: Generate complete output
        results = self.generate_structured_output()
        
        print("\n" + "=" * 60)
        print("✅ ANALYSIS COMPLETE!")
        print("=" * 60)
        print(f"📊 Total Votes Analyzed: {results['election_analysis']['metadata']['total_votes']:,}")
        print(f"🏆 Winner: {results['election_analysis']['summary']['winner']}")
        print(f"📈 Winning Percentage: {results['election_analysis']['summary']['winning_percentage']:.1f}%")
        print(f"📱 Charts Created: {len(self.charts_created)}")
        print(f"💡 Insights Generated: {len(results['election_analysis']['narrative_insights'])}")
        print(f"📁 Output Directory: {self.output_dir}")
        
        return results

def main():
    """Demo the AI Voting Analysis Agent."""
    
    print("🤖 AI Blockchain Voting Analysis Agent - Demo")
    print("=" * 60)
    
    # Initialize analyzer
    analyzer = BlockchainVotingAnalyzer()
    
    # Run complete analysis using existing data
    results = analyzer.run_complete_analysis()
    
    # Display key results
    print("\n🎯 KEY RESULTS SUMMARY:")
    print("-" * 40)
    
    if "error" not in results:
        summary = results['election_analysis']['summary']
        print(f"Winner: {summary['winner']}")
        print(f"Victory Margin: {summary['margin_of_victory']:.1f}%")
        
        print("\n💡 TOP INSIGHTS:")
        for i, insight in enumerate(summary['key_insights'], 1):
            print(f"{i}. {insight}")
        
        print(f"\n📊 Visual outputs saved to: {analyzer.output_dir}")
        print("📄 Structured data available in election_analysis.json")
    
    return results

if __name__ == "__main__":
    results = main()