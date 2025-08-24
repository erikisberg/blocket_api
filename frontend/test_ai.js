// Test script for AI analysis API
// Run this to verify the AI analysis is working

const testListing = {
  title: "Giro merit spherical hjälm",
  description: "Trail hjälm från Giro. Använd ett fåtal gånger. Inga tecken på användning så i väldigt gott skick. Storlek M. Nypris 2299kr",
  price: 750,
  currency: "kr",
  category: "Cyklar",
  condition: "Mycket gott skick",
  images: [
    {
      url: "https://i.blocketcdn.se/pictures/recommerce/1212894864/fc08ecdd-3649-4a1b-b392-78167e231c15.jpg",
      description: "Giro hjälm i gott skick"
    }
  ],
  location: "Jämtland",
  sellerType: "private"
};

async function testAIAnalysis() {
  console.log("🧪 Testing AI Analysis API...");
  console.log("📝 Test listing:", testListing.title);
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        listing: testListing,
        listingId: "test-123",
        bevakningId: "11998349"
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ AI Analysis successful!");
      console.log("📊 Score:", data.result.score + "/5");
      console.log("🧠 Reasoning:", data.result.reasoning.substring(0, 100) + "...");
      console.log("⭐ Confidence:", Math.round(data.result.confidence * 100) + "%");
      console.log("📅 Analyzed at:", data.result.analyzedAt);
      console.log("🤖 Model:", data.result.model);
    } else {
      const error = await response.text();
      console.error("❌ AI Analysis failed:", error);
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

// Run the test
testAIAnalysis();
