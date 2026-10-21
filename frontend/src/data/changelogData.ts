// data/changelogData.ts

export const changelogData = [
  {
    version: "v1.2.0",
    date: "21st October 2026",
    changes: [
      {
        type: "feature", 
        title: "Filter by Category Tags",
        description: "Users can now filter news by tags. The tags on the news article can also be clicked to filter the feed by that tag."
      },
      {
        type: "update",
        title: "Unified Project Name",
        description: "The project name has been unified to \"Bengaluru Civic Update\" across all platforms and documentation. The name of the URL will also be updated soon."
      },
      {
        type: "fix", 
        title: "News Article Mouse Click Behavior",
        description: "Left and middle-click now opens the source article on a new tab. Right-clicking on a news article should now open the context menu correctly."
      },
      {
        type: "update", 
        title: "LLM Context Filtering Update",
        description: "Replaced gemini-3.5-flash to gemini-3.8-flash which supports higher thinking level."
      },
      {
        type: "update", 
        title: "Removed the Hamburger Menu",
        description: "Removed the hamburger menu and moved the About and Changelog pages to the header for better accessibility."
      },
      {
        type: "update", 
        title: "Under the Hood Updates",
        description: "Multiple changes under the hood to improve performance and maintainability, including improved contextual understanding."
      }
    ]
  },
  {
    version: "v1.1.0",
    date: "10th July 2026",
    changes: [
      {
        type: "feature", 
        title: "LLM Context Filtering Update",
        description: "Migrated the natural language processor to GPT OSS 20B. Previously was using Llama 70b which has been now depreciated."
      },
      {
        type: "feature", 
        title: "Added About and Changelog Pages",
        description: "Added the hamburger menu containing the About and Changelogs pages."
      },
      {
        type: "fix",
        title: "Resolved False Positives",
        description: "Fixed an edge case where chronic complaints (like potholes or garbage) were being falsely flagged as current disruptions."
      },
      {
        type: "Upcoming", 
        title: "Upcoming Update",
        description: "Users will be able to filter news by tags like 'Power', 'Water', 'Traffic', etc."
      }
    ]
  },
  {
    version: "v1.0.0",
    date: "1st July 2026",
    changes: [
      {
        type: "feature",
        title: "App Launch",
        description: "Deployed the automated Bengaluru Civic Updates dashboard featuring real time news about city disruptions. Now renamed to \"Bengaluru Civic Update\"."
      }
    ]
  }
];