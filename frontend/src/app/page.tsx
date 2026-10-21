"use client"

import { useState, useEffect } from 'react'

// Flair colours based on state of the category tag states. 
// Change the order of these here to change the order of the flairs in the selection bar.
const tagStyles: Record<string, { text: string, unselected: string, selected: string }> = {
  "Infrastructure": {
    text: "text-[#FF9F55]",
    unselected: "bg-[#FF9F55]/[0.16] border-[#FF9F55]/[0.45] border hover:bg-[#FF9F55]/[0.19] hover:border-[#FF9F55]/[0.65]",
    selected: "bg-[#FF9F55]/[0.22] border-[#FF9F55] border-[1.5px]"
  },
  "Power": {
    text: "text-[#F6C94C]",
    unselected: "bg-[#F6C94C]/[0.16] border-[#F6C94C]/[0.45] border hover:bg-[#F6C94C]/[0.19] hover:border-[#F6C94C]/[0.65]",
    selected: "bg-[#F6C94C]/[0.22] border-[#F6C94C] border-[1.5px]"
  },
  "Public Transport": {
    text: "text-[#4FCB8B]",
    unselected: "bg-[#4FCB8B]/[0.16] border-[#4FCB8B]/[0.45] border hover:bg-[#4FCB8B]/[0.19] hover:border-[#4FCB8B]/[0.65]",
    selected: "bg-[#4FCB8B]/[0.22] border-[#4FCB8B] border-[1.5px]"
  },
  "Traffic": {
    text: "text-[#F28B82]",
    unselected: "bg-[#F28B82]/[0.16] border-[#F28B82]/[0.45] border hover:bg-[#F28B82]/[0.19] hover:border-[#F28B82]/[0.65]",
    selected: "bg-[#F28B82]/[0.22] border-[#F28B82] border-[1.5px]"
  },
  "Water": {
    text: "text-[#5FB0FF]",
    unselected: "bg-[#5FB0FF]/[0.16] border-[#5FB0FF]/[0.45] border hover:bg-[#5FB0FF]/[0.19] hover:border-[#5FB0FF]/[0.65]",
    selected: "bg-[#5FB0FF]/[0.22] border-[#5FB0FF] border-[1.5px]"
  },
  "Weather": {
    text: "text-[#93A4BC]",
    unselected: "bg-[#93A4BC]/[0.16] border-[#93A4BC]/[0.45] border hover:bg-[#93A4BC]/[0.19] hover:border-[#93A4BC]/[0.65]",
    selected: "bg-[#93A4BC]/[0.22] border-[#93A4BC] border-[1.5px]"
  },
  "Others": {
    text: "text-[#B89CF2]",
    unselected: "bg-[#B89CF2]/[0.16] border-[#B89CF2]/[0.45] border hover:bg-[#B89CF2]/[0.19] hover:border-[#B89CF2]/[0.65]",
    selected: "bg-[#B89CF2]/[0.22] border-[#B89CF2] border-[1.5px]"
  },
  "Update": {
    text: "text-[#C7CBD3]",
    unselected: "bg-transparent border-[#C7CBD3]/[0.45] border hover:bg-[#C7CBD3]/[0.19] hover:border-[#C7CBD3]/[0.65]",
    selected: "bg-[#C7CBD3]/[0.22] border-[#C7CBD3] border-[1.5px]"
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown Date'
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) return 'Recent' 

  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-GB', { month: 'short' })
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}

export default function Home() {
  const [news, setNews] = useState([])
  const [mounted, setMounted] = useState(false)
  // State is now an array to support selecting multiple tags simultaneously
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]) 

  useEffect(() => {
    setMounted(true)
    
    // Environment variables for Supabase connection
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

    // Fetching directly from the Supabase REST API, ordering by published date
    fetch(`${SUPABASE_URL}/rest/v1/civic_news?select=*&order=published.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(err => console.error("Failed to fetch news:", err))
  }, [])

  if (!mounted) return null

  // Adds or removes a category from the array, preventing link navigation if clicked from a card
  const toggleCategory = (category: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Filters the feed to show only articles matching the selected flairs.
  const filteredNews = selectedCategories.length === 0 
    ? news 
    : news.filter((item: any) => selectedCategories.includes(item.category || 'Update'))

  // Shared focus-visible classes for keyboard navigation
  const focusRingClasses = "focus-visible:outline-2 focus-visible:outline-[#E8EAEE] focus-visible:outline-offset-3"
  
  // Convert object to array so we can slice it into two rows for the pyramid layout
  const categoryEntries = Object.entries(tagStyles)

  return (
    <main className="max-w-2xl mx-auto min-h-screen bg-[#121418] border-x border-gray-900">
      
      {/* Explicit Pyramid Flair Selection Area */}
      <div className="flex flex-col gap-3 px-4 pt-5 pb-2 border-b border-gray-900">
        
        {/* Top Row: All + First 4 Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategories([])}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${focusRingClasses} ${
              selectedCategories.length === 0
                ? "bg-[#E8EAEE]/[0.22] text-[#E8EAEE] border-[#E8EAEE] border-[1.5px]"
                : "bg-transparent text-gray-400 border-gray-500/[0.45] border hover:bg-gray-500/[0.19] hover:border-gray-500/[0.65]"
            }`}
          >
            All
          </button>
          
          {categoryEntries.slice(0, 4).map(([category, styles]) => {
            const isActive = selectedCategories.includes(category)
            const stateClasses = isActive ? styles.selected : styles.unselected
            
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${focusRingClasses} ${styles.text} ${stateClasses}`}
              >
                {category}
                {isActive && (
                  <span className="text-[10px] leading-none opacity-80 hover:opacity-100" aria-hidden="true">
                    ✕
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Bottom Row: Remaining Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          {categoryEntries.slice(4).map(([category, styles]) => {
            const isActive = selectedCategories.includes(category)
            const stateClasses = isActive ? styles.selected : styles.unselected
            
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${focusRingClasses} ${styles.text} ${stateClasses}`}
              >
                {category}
                {isActive && (
                  <span className="text-[10px] leading-none opacity-80 hover:opacity-100" aria-hidden="true">
                    ✕
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* News Feed */}
      <div className="flex flex-col gap-4 p-4">
        {filteredNews.map((item: any) => {
          const category = item.category || 'Update'
          const style = tagStyles[category] || tagStyles['Update']
          
          // Article tags also reflect their active selected state
          const isTagSelected = selectedCategories.includes(category)
          const tagClasses = isTagSelected ? style.selected : style.unselected

          return (
            <a 
              key={item.id} 
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-black border border-gray-800 rounded-xl shadow-sm hover:border-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex flex-col min-w-0">
                
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                  <time dateTime={item.published}>
                    {formatDate(item.published)}
                  </time>
                  <span>·</span>
                  <span 
                    onClick={(e) => toggleCategory(category, e)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all ${focusRingClasses} ${style.text} ${tagClasses}`}
                    title={`Filter by ${category}`}
                  >
                    {category}
                  </span>
                </div>

                <h2 className="text-base font-medium text-gray-100 mb-2 leading-snug">
                  {item.title}
                </h2>

                <div 
                  className="text-sm text-gray-400 line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: item.description }} 
                />
              </div>
            </a>
          )
        })}
        
        {/* Empty State Fallback */}
        {filteredNews.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            No updates found for the selected categories.
          </div>
        )}
      </div>
    </main>
  )
}