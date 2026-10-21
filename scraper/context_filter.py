import os
import json
import time
from groq import Groq
from google import genai
from google.genai import types

# Initialize both clients using environment variables
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Defining the disruption keywords here to fix/prevent infinite loop in the files. Previously, both files kept calling each other.

DETERMINISTIC_KEYWORDS = [
    "bangalore", "bengaluru", "ooru", "namma ooru", "blr", "tech capital of india", "silicon valley of india", "it hub",
    "bbmp", "bescom", "bwssb", "bmrc", "namma metro", "bmtc", "bmrcl", "gba",
    "btp", "bengaluru traffic police", "bcp", "bengaluru police", "bengaluru city police",
    "north bengaluru", "south bengaluru", "east bengaluru", "west bengaluru", "kr pura", "kr puram", "church street", "koramangala", "whitefield", "electronic city", "marathahalli", "yelahanka", "hebbal",
    "btm layout", "jp nagar", "indiranagar", "hsr layout"
    ]

DISRUPTION_KEYWORDS = [
    "bbmp", "bescom", "bwssb", "bmrc", "namma metro", "bmtc", "bmrcl", "gba", 
    "road closure", "road repair", "road maintainence", "road construction", "road work", "road closed",
     "traffic", "collision", "pileup", "traffic jam", "congestion", "diversion", "disruption",
    "metro delay", "metro disruption", "metro maintenance", "metro work", "metro closed",
    "bus delay", "bus disruption", "bus maintenance", "bus strike", "bmtc strike",
    "garbage", "waste", "garbage collection", "garbage strike", "garbage disruption", "sanitation",
    "water cut", "water disruption", "water work", "water closed", "water supply", "water shortage",
    "power cut", "power outage", "power disruption", "grid work", "grid maintenance", "scheduled power cut", "scheduled power disruption", "scheduled grid work", "scheduled grid maintenance", "scheduled power cut", "scheduled power disruption", "scheduled power outage",
    "holiday", "public holiday", "bank holiday", "school holiday", "festival", "event hliday",
    "bandh", "statewide", "city wide", "citywide",
    "monsoon alert", "weather disruption", "flooding", "water logging",
    "delay", "disruption", "maintenance", "closed", "inconvenience", "shortage",
    "strike", "protest", "dharna", "agitation", "rally", "march"
    ]

SYSTEM_PROMPT = f"""
        You are a highly strict filtering algorithm for Bengaluru or Bangalore. Analyze the provided news headline and description. 
        Determine if it represents an ACTIVE, ONGOING, or UPCOMING physical disruptions to everyday public life.


        Strict Rules for REJECTION (Set is_disruption to false if ANY apply):
        1. GEOGRAPHY: The disruption is outside Bengaluru.
        2. 2. PAST, RESOLVED, OR RECAPS: The text recounts an event that already happened (e.g., "Friday night traffic", "yesterday's rain"), uses past tense, or indicates the incident is over (e.g., "services restored", "resumed", "was delayed", "evacuated", "cleared", "rectified"). The disruption MUST be active right now or definitively scheduled for the future.
        3. POST-MORTEM OR ANALYSIS: The text is discussing the aftermath, audits, reviews, or opinions regarding a previous disruption (e.g., "trigger calls for audit", "exposes fault lines").
        4. CHRONIC ISSUES & RECURRING RUSH: General complaints or reports about long-standing infrastructural decay or predictable spikes (e.g., garbage piles, stench, broken footpaths, potholes, daily traffic, festive/weekend rush like "buses crawl out", "holiday congestion"). Reject unless a specific, sudden, and catastrophic event has actively blocked or severed infrastructure today.
        5. ACCIDENTS & TRAGIC CONSEQUENCES: Standard accidents, fatal incidents, or tragedies resulting from chronic issues (e.g., "traffic congestion claims life", "ambulance stuck in jam", "worker injured") are NOT new active disruptions. They are post-mortem consequences of existing conditions. Reject these UNLESS the text explicitly states the accident itself is actively causing a massive, ongoing physical blockage right now (e.g., a multi-vehicle pileup requiring cranes).
        6. ADMINISTRATIVE, POLITICAL & HOLIDAYS: Civic administrative news, elections, voting days, routine school/college holidays, or delays in future construction are NOT active physical infrastructure disruptions. A service must be actively running and unexpectedly halted to be disrupted.
        7. ORGANIZED PROTESTS: Protests, rallies, and strikes are NOT disruptions UNLESS the text explicitly states they are actively blocking roads, highways, or public transit. Assume protests are in designated enclosures otherwise.
        8. PRIVATE COMMERCIAL ENTITIES: Closures, strikes, or operational issues affecting private businesses (e.g., restaurants, malls, hotels shutting down) are NOT public infrastructure disruptions.

        Strict Rules for ACCEPTANCE (Set is_disruption to true):
        1. The event is an explicitly announced public service halt (e.g., scheduled BWSSB water cut, BESCOM power outage, BMTC strike) by civic bodies.
        2. The event is happening RIGHT NOW or is scheduled for the FUTURE (e.g., "Metro services suspended", "power cut tomorrow").

        Allowed categories are exactly: "Traffic", "Power", "Water", "Weather", "Infrastructure", "Public Transport", "Others", "Update"
        You must respond strictly in JSON format matching this exact schema:
        Note: The confidence_score must be a floating point number between 0.0 and 1.0 indicating your certainty.
        {{
        "is_disruption": true or false,
        "category": "Traffic",
        "confidence_score": 0.85,
        "reasoning": "A one sentence explanation of your decision or reasoning."
        }}
"""
# Using double curly braces becasue we want python to treat them as literal text instead of trying to evaluate them as code blocks.

def get_disruption_context(headline, description):
    """
    Evaluates news text. Tries Groq (GPT OSS 20B) first, falls back to Google (Gemini) if Groq fails or reasoning is low confidence.
    Returns tracking flags, reasoning, and confidence scores for both models.
    """
    groq_result = None                  # Initialize groq_result to None to ensure it's defined even if Groq fails.
    groq_reasoning = "Not executed"     # Initialize groq_reasoning to a default value to avoid undefined variable issues.
    groq_confidence = 0.0               # Initialize groq_confidence to a default value to avoid undefined variable issues.
    gemini_confidence = 0.0             # Setting up a default value for cases when Gemini doesn't run due to Groq's success.

    # ----- PRIMARY: GROQ (GPT OSS 20B) -----
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Headline: {headline}\nDescription: {description}"}
            ],
            model="openai/gpt-oss-20b",
            response_format={"type": "json_object"},
            temperature=0                                   # Ensures the model gives a logical output rather than a creative one.
        )


        # Extracting data to use in our print statements and to store these values for our performance logs in Airtable.
        groq_result = json.loads(chat_completion.choices[0].message.content)
        groq_reasoning = groq_result.get("reasoning", "No reasoning provided.")     # Safely extract reasoning, defaulting to a message if not present.
        groq_confidence = float(groq_result.get("confidence_score", 0.0))           # The 0.0 default ensures that if the model's response doesn't include a confidence score, it will be treated as 0 confidence but will not crash the program due to a missing key.


        # Check if Groq is uncertain about its decision
        if groq_confidence < 0.8:
            print(f"\nLOW CONFIDENCE from Groq:\n"
                  f"Confidence: {groq_confidence}\n"
                  f"is_disruption: {groq_result.get('is_disruption')}\n"
                  f"Reasoning: {groq_reasoning}\n"
                  f"Routing to Gemini for review...")
            # Raising an error intentionally forces execution into the 'except' block below
            raise ValueError("Confidence score below threshold")

        return {
            "is_disruption": groq_result.get("is_disruption", False),   # As a fallback, defaulting to False if the key is missing
            "category": groq_result.get("category", "Update"),          # Defaulting to "Update" if the key is missing
            "groq_confidence": groq_confidence,                         # Returning the Groq confidence score
            "gemini_confidence": gemini_confidence,                     # Returning the Gemini confidence score, which will be 0.0 since Gemini was not executed
            "groq_reasoning": groq_reasoning,                           # Include the reasoning for our Airtable Performance_Log
            "gemini_reasoning":"Not executed",                          # When Groq succeeds with a high confidence score, Gemini is not executed, so we set this to a default message.
            "routed_to_gemini": False,                                  # Since Groq succeeded with high confidence, we did not route to Gemini.
            "fallback_to_groq": False                                   # Since already Groq succeeded, we did not need to fallback to Groq.
        }
        
    except Exception as groq_error:
        print(f"Primary API (Groq) failed: {groq_error}. \n Initiating Gemini fallback...")
        
        # ----- FALLBACK: GOOGLE (GEMINI) -----
        try:
            time.sleep(13) # Respecting Gemini's strict 5 requests per minute limit
            
            response = gemini_client.models.generate_content(
                model='gemini-3.8-flash',
                contents=f"Headline: {headline}\nDescription: {description}",
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    thinking_level="high"                   # Replaced temperature=0. Forces deep reasoning since this one is our final decision maker.
                )
            )
            gemini_result = json.loads(response.text)
            gemini_confidence = float(gemini_result.get("confidence_score", 0.0))
            return {
                "is_disruption": gemini_result.get("is_disruption", False),                     # Defaulting to False if the key is missing
                "category": gemini_result.get("category", "Update"),                            # Defaulting to "Update" if the key is missing
                "groq_confidence": groq_confidence,                                             # Returning Groq's original confidence score since we are now in the Gemini fallback
                "gemini_confidence": gemini_confidence,                                         # Returning the Gemini confidence score
                "groq_reasoning": groq_reasoning,                                               # Include the reasoning from Groq for our Airtable Performance_Log
                "gemini_reasoning": gemini_result.get("reasoning", "No reasoning provided."),   # Include the reasoning from Gemini for our Airtable Performance_Log
                "routed_to_gemini": True,                                                       # Since we routed to Gemini due to Groq's failure or low confidence, we set this to True.
                "fallback_to_groq": False                                                       # Since we are currently in the Gemini fallback, we have not yet needed to fallback to Groq, so we set this to False.
            }
            
        except Exception as gemini_error:
            print(f"Fallback API (Gemini) also failed: {gemini_error}.")

            # Using Groq's original result since Gemini failed. Cannot reject an article just because the fallback failed for whatever reason.
            if groq_result:
                print("Reverting to Groq's original result")
                return {
                    "is_disruption": groq_result.get("is_disruption", False),       # Defaulting to False if the key is missing
                    "category": groq_result.get("category", "Update"),              # Defaulting to "Update" if the key is missing
                    "groq_confidence": groq_confidence,                             # Returning the Groq confidence score
                    "gemini_confidence": gemini_confidence,                         # Returning the Gemini confidence score, which will be 0.0 since Gemini failed.
                    "groq_reasoning": groq_reasoning,                               # Returning Groq's original reasoning since Gemini failed
                    "gemini_reasoning":f"Gemini fallback failed: {gemini_error}",   # Returning Gemini's failure reason for our Airtable Performance_Log
                    "routed_to_gemini": True,                                       # Since we attempted to route to Gemini due to Groq's failure or low confidence, we set this to True.
                    "fallback_to_groq": True                                        # Since we are reverting back to Groq's result after Gemini's failure, we set this to True.
                }

            # Returning a default response indicating both APIs failed.            
            return {
                "is_disruption": False, 
                "category": "Error", 
                "groq_confidence": groq_confidence,                 # Returning the Groq confidence score, which will be 0.0 since Groq failed.
                "gemini_confidence": gemini_confidence,             # Returning the Gemini confidence score, which will be 0.0 since Gemini failed.
                "groq_reasoning": f"Failed: {groq_error}",
                "gemini_reasoning": f"Failed: {gemini_error}",
                "routed_to_gemini": True,                           # Since we attempted to route to Gemini due to Groq's failure or low confidence, we set this to True.
                "fallback_to_groq": False,                          # Since we are not reverting back to Groq's result after Gemini's failure (because both failed), we set this to False.
            }