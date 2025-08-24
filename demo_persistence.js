// Demo script showing how AI analysis results are persisted
// This demonstrates the data structure after AI analysis

const sampleListingWithAI = {
  "ad": {
    "ad_id": "1212894864",
    "subject": "Giro merit spherical",
    "body": "Trail hjälm från Giro. Använd ett fåtal gånger...",
    "price": {
      "value": 750,
      "suffix": "kr"
    },
    "images": [
      {
        "url": "https://i.blocketcdn.se/pictures/recommerce/1212894864/fc08ecdd-3649-4a1b-b392-78167e231c15.jpg",
        "width": 768,
        "height": 1024,
        "type": "image"
      }
    ],
    "advertiser": {
      "name": "joeljansson",
      "type": "private"
    }
  },
  "discovered_at": "2025-08-23T20:26:07.652325",
  "ai_analysis": {
    "score": 4,
    "reasoning": "Denna Giro hjälm är tydligt undervärd. Nypris är 2299kr men säljs för endast 750kr. Även om den är begagnad så är skicket mycket gott enligt beskrivningen. Trail-hjälmar av denna kvalitet behåller ofta sitt värde väl.",
    "confidence": 0.85,
    "factors": [
      "Stor prisskillnad mot nypris",
      "Gott skick enligt beskrivning",
      "Kvalitetsmärke (Giro)",
      "Trail-hjälm behåller värde"
    ],
    "recommendation": "Köp! Detta är en utmärkt affär. Hjälmen verkar vara i mycket gott skick och priset är betydligt under marknadsvärde.",
    "analyzedAt": "2025-08-23T21:30:00.000Z",
    "model": "claude-opus-4-1-20250805"
  }
};

console.log("📊 Sample listing with AI analysis:");
console.log(JSON.stringify(sampleListingWithAI, null, 2));

console.log("\n🔍 Key benefits of persistent storage:");
console.log("✅ AI scores are saved and don't need re-analysis");
console.log("✅ Analysis timestamp shows when it was performed");
console.log("✅ Confidence levels help assess reliability");
console.log("✅ Factors explain the reasoning behind the score");
console.log("✅ Recommendations guide purchasing decisions");

console.log("\n💾 Data structure in bevakningar_listings.json:");
console.log("Each listing now includes an 'ai_analysis' field with:");
console.log("- score: 1-5 rating");
console.log("- reasoning: Detailed explanation in Swedish");
console.log("- confidence: 0-1 reliability score");
console.log("- factors: Key points that influenced the score");
console.log("- recommendation: Actionable advice");
console.log("- analyzedAt: ISO timestamp of analysis");
console.log("- model: AI model used (Claude Opus 4.1)");
