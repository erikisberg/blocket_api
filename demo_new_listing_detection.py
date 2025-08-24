#!/usr/bin/env python3
"""
Demo script showing what you'll see when new listings are detected
"""

from blocket_api import BlocketAPI
import json

def demo_new_listing_detection():
    api = BlocketAPI()
    
    print("🎯 DEMO: What You'll See When New Listings Are Detected")
    print("=" * 70)
    
    # Get your bevakningar
    searches = api.saved_searches()
    
    for search in searches:
        search_id = search['id']
        name = search['name']
        
        print(f"\n🔍 BEVAKNING: {name}")
        print(f"ID: {search_id}")
        print("=" * 50)
        
        try:
            # Get recent listings to simulate "new" discoveries
            response = api.get_listings(search_id=int(search_id), limit=3)
            
            if 'data' in response and response['data']:
                print(f"📝 NEW LISTINGS DETECTED from {name}:")
                print("=" * 60)
                
                for i, listing in enumerate(response['data'], 1):
                    if 'ad' in listing:
                        ad = listing['ad']
                        print(f"\n🆕 NEW LISTING #{i}:")
                        print(f"   📌 Title: {ad.get('subject', 'N/A')}")
                        
                        # Price information
                        price = ad.get('price', {})
                        price_str = f"{price.get('value', 'N/A')} {price.get('suffix', '')}"
                        print(f"   💰 Price: {price_str}")
                        
                        # Location and status
                        print(f"   📍 Location: {ad.get('zipcode', 'N/A')}")
                        print(f"   📅 Listed: {ad.get('list_time', 'N/A')}")
                        print(f"   ✅ Status: {ad.get('ad_status', 'N/A')}")
                        
                        # Full description
                        body = ad.get('body', '')
                        if body:
                            print(f"   📝 Description: {body}")
                        
                        # Images
                        if 'images' in ad and ad['images']:
                            print(f"   🖼️  Images: {len(ad['images'])} available")
                            for j, img in enumerate(ad['images'][:3], 1):  # Show first 3 image URLs
                                if 'url' in img:
                                    print(f"      Image {j}: {img['url']}")
                        
                        # Seller information
                        if 'advertiser' in ad:
                            advertiser = ad['advertiser']
                            print(f"   👤 Seller: {advertiser.get('name', 'N/A')} ({advertiser.get('type', 'N/A')})")
                        
                        print("-" * 40)
                    else:
                        print(f"   • Raw listing data: {listing}")
                
                print("=" * 60)
                
        except Exception as e:
            print(f"❌ Error getting listings: {e}")
        
        print("\n" + "=" * 70)

if __name__ == "__main__":
    demo_new_listing_detection()
