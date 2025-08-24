#!/usr/bin/env python3
"""
Test script to show detailed listing information from bevakningar
"""

from blocket_api import BlocketAPI
import json

def test_listings():
    api = BlocketAPI()
    
    print("🔍 TESTING BEVAKNINGAR LISTINGS")
    print("=" * 60)
    
    # 1. Get all saved searches
    print("\n📋 Your saved searches:")
    searches = api.saved_searches()
    for search in searches:
        print(f"  • {search['name']} (ID: {search['id']})")
        print(f"    Total items: {search.get('total_count', 'N/A')}")
        print(f"    New items: {search.get('new_count', 'N/A')}")
        print()
    
    # 2. Get detailed listings from each bevakning
    for search in searches:
        search_id = search['id']
        name = search['name']
        
        print(f"📊 DETAILED LISTINGS: {name}")
        print(f"ID: {search_id}")
        print("-" * 50)
        
        try:
            # Get listings (limit to 5 for demo)
            response = api.get_listings(search_id=int(search_id), limit=5)
            
            if 'data' in response and response['data']:
                print(f"Found {len(response['data'])} listings (showing first 5):")
                print()
                
                for i, listing in enumerate(response['data'], 1):
                    print(f"📝 Listing #{i}:")
                    
                    if 'ad' in listing:
                        ad = listing['ad']
                        print(f"  Title: {ad.get('subject', 'N/A')}")
                        print(f"  Price: {ad.get('price', {}).get('value', 'N/A')} {ad.get('price', {}).get('suffix', '')}")
                        print(f"  Location: {ad.get('zipcode', 'N/A')}")
                        print(f"  Status: {ad.get('ad_status', 'N/A')}")
                        print(f"  Listed: {ad.get('list_time', 'N/A')}")
                        
                        # Show body text (first 100 chars)
                        body = ad.get('body', '')
                        if body:
                            body_preview = body[:100] + "..." if len(body) > 100 else body
                            print(f"  Description: {body_preview}")
                        
                        # Show images if available
                        if 'images' in ad and ad['images']:
                            print(f"  Images: {len(ad['images'])} available")
                        
                        # Show advertiser info
                        if 'advertiser' in ad:
                            advertiser = ad['advertiser']
                            print(f"  Seller: {advertiser.get('name', 'N/A')} ({advertiser.get('type', 'N/A')})")
                        
                        print()
                    else:
                        print(f"  Raw data: {json.dumps(listing, indent=2, ensure_ascii=False)}")
                        print()
            else:
                print("No listings data found")
                
        except Exception as e:
            print(f"❌ Error getting listings: {e}")
        
        print("=" * 60)
        print()

if __name__ == "__main__":
    test_listings()
