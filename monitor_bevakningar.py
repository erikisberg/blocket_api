#!/usr/bin/env python3
"""
Blocket Bevakningar Monitor

This script regularly checks your saved searches (bevakningar) for new items
and provides notifications when new listings are found.
"""

import time
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import logging

from blocket_api import BlocketAPI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bevakningar_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class BevakningState:
    """Track the state of a bevakning"""
    id: str
    name: str
    last_total_count: int
    last_new_count: int
    last_check: datetime
    new_items_since_start: int
    total_items_seen: int

class BevakningarMonitor:
    def __init__(self, check_interval: int = 300):  # 5 minutes default
        self.api = BlocketAPI()
        self.check_interval = check_interval
        self.states: Dict[str, BevakningState] = {}
        self.state_file = "bevakningar_state.json"
        self.listings_file = "bevakningar_listings.json"
        self.load_state()
        self.load_listings()
        
    def load_state(self):
        """Load previous state from file"""
        try:
            if os.path.exists(self.state_file):
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
                    for bevakning_data in data.values():
                        # Convert string back to datetime
                        bevakning_data['last_check'] = datetime.fromisoformat(bevakning_data['last_check'])
                        self.states[bevakning_data['id']] = BevakningState(**bevakning_data)
                logger.info(f"Loaded state for {len(self.states)} bevakningar")
        except Exception as e:
            logger.warning(f"Could not load state file: {e}")
    
    def save_state(self):
        """Save current state to file"""
        try:
            # Convert datetime to string for JSON serialization
            state_data = {}
            for bevakning_id, state in self.states.items():
                state_dict = asdict(state)
                state_dict['last_check'] = state.last_check.isoformat()
                state_data[bevakning_id] = state_dict
            
            with open(self.state_file, 'w') as f:
                json.dump(state_data, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save state file: {e}")
    
    def load_listings(self):
        """Load existing listings from file"""
        try:
            if os.path.exists(self.listings_file):
                with open(self.listings_file, 'r') as f:
                    self.listings = json.load(f)
                logger.info(f"Loaded {sum(len(bevakning_listings) for bevakning_listings in self.listings.values())} existing listings")
            else:
                self.listings = {}
                logger.info("Starting with empty listings database")
        except Exception as e:
            logger.warning(f"Could not load listings file: {e}")
            self.listings = {}
    
    def save_listings(self):
        """Save all listings to file"""
        try:
            with open(self.listings_file, 'w') as f:
                json.dump(self.listings, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {sum(len(bevakning_listings) for bevakning_listings in self.listings.values())} listings to database")
        except Exception as e:
            logger.error(f"Could not save listings file: {e}")
    
    def update_listings_database(self, bevakning_id: str, new_listings: List[Dict]):
        """Update listings database with new listings"""
        if bevakning_id not in self.listings:
            self.listings[bevakning_id] = []
        
        # Create a set of existing listing IDs to avoid duplicates
        existing_ids = {listing.get('ad', {}).get('ad_id', '') for listing in self.listings[bevakning_id]}
        
        # Add new listings that aren't already in the database
        added_count = 0
        for listing in new_listings:
            listing_id = listing.get('ad', {}).get('ad_id', '')
            if listing_id and listing_id not in existing_ids:
                # Add timestamp when we discovered this listing
                listing['discovered_at'] = datetime.now().isoformat()
                self.listings[bevakning_id].append(listing)
                existing_ids.add(listing_id)
                added_count += 1
        
        if added_count > 0:
            logger.info(f"Added {added_count} new listings to database for bevakning {bevakning_id}")
            # Save after each update
            self.save_listings()
    
    def get_bevakningar(self) -> List[Dict]:
        """Get current list of saved searches"""
        try:
            return self.api.saved_searches()
        except Exception as e:
            logger.error(f"Error getting saved searches: {e}")
            return []
    
    def check_for_new_items(self, bevakning: Dict) -> Optional[BevakningState]:
        """Check a single bevakning for new items"""
        bevakning_id = bevakning['id']
        name = bevakning['name']
        current_total = bevakning.get('total_count', 0)
        current_new = bevakning.get('new_count', 0)
        
        # Get or create state for this bevakning
        if bevakning_id not in self.states:
            self.states[bevakning_id] = BevakningState(
                id=bevakning_id,
                name=name,
                last_total_count=current_total,
                last_new_count=current_new,
                last_check=datetime.now(),
                new_items_since_start=0,
                total_items_seen=current_total
            )
            logger.info(f"🆕 New bevakning discovered: {name} (ID: {bevakning_id})")
            return self.states[bevakning_id]
        
        state = self.states[bevakning_id]
        previous_total = state.last_total_count
        previous_new = state.last_new_count
        
        # Check for changes
        new_items_found = 0
        if current_total > previous_total:
            new_items_found = current_total - previous_total
            logger.info(f"🆕 {name}: Found {new_items_found} new items! (Total: {previous_total} → {current_total})")
        
        if current_new > 0:
            logger.info(f"🔔 {name}: {current_new} new items available")
        
        # Update state
        state.last_total_count = current_total
        state.last_new_count = current_new
        state.last_check = datetime.now()
        state.new_items_since_start += new_items_found
        state.total_items_seen = max(state.total_items_seen, current_total)
        
        return state
    
    def get_recent_listings(self, bevakning_id: str, limit: int = 10) -> List[Dict]:
        """Get recent listings from a specific bevakning"""
        try:
            response = self.api.get_listings(search_id=int(bevakning_id), limit=limit)
            return response.get('data', [])
        except Exception as e:
            logger.error(f"Error getting listings for bevakning {bevakning_id}: {e}")
            return []
    
    def display_summary(self):
        """Display a summary of all bevakningar"""
        print("\n" + "="*60)
        print("📊 BEVAKNINGAR MONITORING SUMMARY")
        print("="*60)
        
        for state in self.states.values():
            print(f"\n🔍 {state.name}")
            print(f"   ID: {state.id}")
            print(f"   Current Total: {state.last_total_count}")
            print(f"   New Items: {state.last_new_count}")
            print(f"   Last Check: {state.last_check.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   New Items Since Start: {state.new_items_since_start}")
            print(f"   Total Items Seen: {state.total_items_seen}")
        
        print("\n" + "="*60)
    
    def run_monitoring_loop(self, max_iterations: Optional[int] = None):
        """Main monitoring loop"""
        iteration = 0
        logger.info("🚀 Starting Blocket Bevakningar Monitor...")
        
        try:
            while max_iterations is None or iteration < max_iterations:
                iteration += 1
                current_time = datetime.now()
                
                logger.info(f"\n🔄 Check #{iteration} at {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Get current bevakningar
                bevakningar = self.get_bevakningar()
                if not bevakningar:
                    logger.warning("No bevakningar found or API error")
                    continue
                
                logger.info(f"Found {len(bevakningar)} active bevakningar")
                
                # Check each bevakning
                for bevakning in bevakningar:
                    state = self.check_for_new_items(bevakning)
                    
                    # Always get current listings and update database
                    current_listings = self.get_recent_listings(state.id, limit=99)
                    if current_listings:
                        self.update_listings_database(state.id, current_listings)
                    
                    if state and state.new_items_since_start > 0:
                        # Show detailed listings for new items
                        recent_listings = self.get_recent_listings(state.id, limit=5)
                        if recent_listings:
                            logger.info(f"📝 NEW LISTINGS DETAILS from {state.name}:")
                            logger.info("=" * 60)
                            
                            for i, listing in enumerate(recent_listings, 1):
                                if 'ad' in listing:
                                    ad = listing['ad']
                                    logger.info(f"\n🆕 NEW LISTING #{i}:")
                                    logger.info(f"   📌 Title: {ad.get('subject', 'N/A')}")
                                    
                                    # Price information
                                    price = ad.get('price', {})
                                    price_str = f"{price.get('value', 'N/A')} {price.get('suffix', '')}"
                                    logger.info(f"   💰 Price: {price_str}")
                                    
                                    # Location and status
                                    logger.info(f"   📍 Location: {ad.get('zipcode', 'N/A')}")
                                    logger.info(f"   📅 Listed: {ad.get('list_time', 'N/A')}")
                                    logger.info(f"   ✅ Status: {ad.get('ad_status', 'N/A')}")
                                    
                                    # Full description
                                    body = ad.get('body', '')
                                    if body:
                                        logger.info(f"   📝 Description: {body}")
                                    
                                    # Images
                                    if 'images' in ad and ad['images']:
                                        logger.info(f"   🖼️  Images: {len(ad['images'])} available")
                                        for j, img in enumerate(ad['images'][:3], 1):  # Show first 3 image URLs
                                            if 'url' in img:
                                                logger.info(f"      Image {j}: {img['url']}")
                                    
                                    # Seller information
                                    if 'advertiser' in ad:
                                        advertiser = ad['advertiser']
                                        logger.info(f"   👤 Seller: {advertiser.get('name', 'N/A')} ({advertiser.get('type', 'N/A')})")
                                    
                                    logger.info("-" * 40)
                                else:
                                    logger.info(f"   • Raw listing data: {listing}")
                            
                            logger.info("=" * 60)
                
                # Save state
                self.save_state()
                
                # Display summary every 5 iterations
                if iteration % 5 == 0:
                    self.display_summary()
                
                # Wait for next check
                if max_iterations is None or iteration < max_iterations:
                    logger.info(f"⏰ Waiting {self.check_interval} seconds until next check...")
                    time.sleep(self.check_interval)
                
        except KeyboardInterrupt:
            logger.info("\n🛑 Monitoring stopped by user")
        except Exception as e:
            logger.error(f"❌ Unexpected error in monitoring loop: {e}")
        finally:
            logger.info("💾 Saving final state and listings...")
            self.save_state()
            self.save_listings()
            self.display_summary()
            logger.info("👋 Monitor stopped")

def main():
    """Main function with command line options"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Monitor Blocket Bevakningar for new items")
    parser.add_argument(
        "--interval", "-i", 
        type=int, 
        default=300,
        help="Check interval in seconds (default: 300 = 5 minutes)"
    )
    parser.add_argument(
        "--iterations", "-n",
        type=int,
        help="Maximum number of checks to run (default: run indefinitely)"
    )
    parser.add_argument(
        "--once", "-o",
        action="store_true",
        help="Run just once and exit"
    )
    
    args = parser.parse_args()
    
    # Create monitor
    monitor = BevakningarMonitor(check_interval=args.interval)
    
    if args.once:
        # Just run once
        logger.info("🔍 Running single check...")
        bevakningar = monitor.get_bevakningar()
        for bevakning in bevakningar:
            state = monitor.check_for_new_items(bevakning)
            # Get and save all listings
            current_listings = monitor.get_recent_listings(state.id, limit=99)
            if current_listings:
                monitor.update_listings_database(state.id, current_listings)
        monitor.save_state()
        monitor.save_listings()
        monitor.display_summary()
    else:
        # Run monitoring loop
        monitor.run_monitoring_loop(max_iterations=args.iterations)

if __name__ == "__main__":
    main()
