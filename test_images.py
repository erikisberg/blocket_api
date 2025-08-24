#!/usr/bin/env python3
"""
Test script to show detailed image information from bevakningar
"""

from blocket_api import BlocketAPI
import json

def test_images():
    api = BlocketAPI()
    
    print("🖼️  TESTING IMAGE INFORMATION FROM BEVAKNINGAR")
    print("=" * 70)
    
    # Get your saved searches
    searches = api.saved_searches()
    
    for search in searches:
        search_id = search['id']
        name = search['name']
        
        print(f"\n📸 IMAGES FROM: {name}")
        print(f"ID: {search_id}")
        print("-" * 60)
        
        try:
            # Get listings (limit to 3 for demo)
            response = api.get_listings(search_id=int(search_id), limit=3)
            
            if 'data' in response and response['data']:
                for i, listing in enumerate(response['data'], 1):
                    print(f"\n📝 Listing #{i}:")
                    
                    if 'ad' in listing:
                        ad = listing['ad']
                        print(f"  Title: {ad.get('subject', 'N/A')}")
                        print(f"  Price: {ad.get('price', {}).get('value', 'N/A')} {ad.get('price', {}).get('suffix', '')}")
                        
                        # Show detailed image information
                        if 'images' in ad and ad['images']:
                            print(f"  🖼️  Images: {len(ad['images'])} available")
                            
                            for j, image in enumerate(ad['images'], 1):
                                print(f"    Image #{j}:")
                                print(f"      ID: {image.get('id', 'N/A')}")
                                print(f"      URL: {image.get('url', 'N/A')}")
                                print(f"      Type: {image.get('type', 'N/A')}")
                                print(f"      Order: {image.get('order', 'N/A')}")
                                
                                # Check if URL is accessible
                                if 'url' in image and image['url']:
                                    print(f"      🔗 Direct link: {image['url']}")
                                print()
                        else:
                            print(f"  ❌ No images available")
                        
                        # Show raw image data for debugging
                        print(f"  🔍 Raw image data:")
                        print(f"    {json.dumps(ad.get('images', []), indent=4, ensure_ascii=False)}")
                        
                    else:
                        print(f"  Raw listing data: {json.dumps(listing, indent=2, ensure_ascii=False)}")
                    
                    print("-" * 40)
                    
            else:
                print("No listings data found")
                
        except Exception as e:
            print(f"❌ Error getting listings: {e}")
        
        print("=" * 70)

if __name__ == "__main__":
    test_images()
