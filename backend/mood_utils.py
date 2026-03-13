"""
Mood/Emotion Standardization System
Defines standard moods with emojis and utilities for normalization
"""

# Standard mood mappings with emojis
STANDARD_MOODS = {
    "Happy": "Happy 😊",
    "Calm": "Calm 🌊",
    "Anxious": "Anxious 😰",
    "Energized": "Energized ⚡",
    "Sad": "Sad 😔",
    "Neutral": "Neutral 😐",
    "Overwhelmed": "Overwhelmed 🌪️",
    "Excited": "Excited 🎉",
    "Lethargic": "Lethargic 😴",
    "Motivated": "Motivated 💪"
}

# Mood to emoji mapping
MOOD_EMOJIS = {
    "Happy": "😊",
    "Calm": "🌊",
    "Anxious": "😰",
    "Energized": "⚡",
    "Sad": "😔",
    "Neutral": "😐",
    "Overwhelmed": "🌪️",
    "Excited": "🎉",
    "Lethargic": "😴",
    "Motivated": "💪"
}

# Mood to sentiment value (for charting)
MOOD_TO_SENTIMENT_VALUE = {
    "Happy": 5,
    "Excited": 5,
    "Motivated": 5,
    "Energized": 4,
    "Calm": 4,
    "Neutral": 3,
    "Anxious": 2,
    "Overwhelmed": 2,
    "Sad": 1,
    "Lethargic": 1
}

# Mood to color mapping
MOOD_COLORS = {
    "Happy": "#10B981",      # green
    "Excited": "#F59E0B",    # yellow
    "Motivated": "#06B6D4",  # cyan
    "Energized": "#84CC16",  # lime
    "Calm": "#0EA5E9",       # blue
    "Neutral": "#6B7280",    # gray
    "Anxious": "#F97316",    # orange
    "Overwhelmed": "#EF4444", # red
    "Sad": "#8B5CF6",        # purple
    "Lethargic": "#9CA3AF"   # light gray
}


def normalize_mood(mood_str: str) -> str:
    """
    Normalize any mood string to standard format
    
    Input: "happy", "Happy", "happy 😊", "Happy 😊"
    Output: "Happy 😊"
    """
    if not mood_str:
        return STANDARD_MOODS["Neutral"]
    
    # Remove existing emojis and clean
    cleaned = mood_str
    for emoji in MOOD_EMOJIS.values():
        cleaned = cleaned.replace(emoji, "")
    cleaned = cleaned.strip()
    
    # Try to match to standard mood (case-insensitive)
    for key in STANDARD_MOODS.keys():
        if cleaned.lower() == key.lower():
            return STANDARD_MOODS[key]
    
    # If no match, try partial match
    for key in STANDARD_MOODS.keys():
        if key.lower() in cleaned.lower() or cleaned.lower() in key.lower():
            return STANDARD_MOODS[key]
    
    # Default to Neutral if can't determine
    return STANDARD_MOODS["Neutral"]


def get_mood_base_name(mood_str: str) -> str:
    """
    Extract just the mood name without emoji
    
    Input: "Happy 😊"
    Output: "Happy"
    """
    for name in STANDARD_MOODS.keys():
        if name in mood_str:
            return name
    return "Neutral"


def get_mood_emoji(mood_str: str) -> str:
    """Get emoji for a mood"""
    base_name = get_mood_base_name(mood_str)
    return MOOD_EMOJIS.get(base_name, "😐")


def get_mood_color(mood_str: str) -> str:
    """Get color for a mood"""
    base_name = get_mood_base_name(mood_str)
    return MOOD_COLORS.get(base_name, "#6B7280")


def get_sentiment_value(mood_str: str) -> int:
    """Get numerical sentiment value for charting"""
    base_name = get_mood_base_name(mood_str)
    return MOOD_TO_SENTIMENT_VALUE.get(base_name, 3)


# Standard tag colors
TAG_COLORS = {
    "Testing": "gray",
    "Routine": "blue",
    "Habit Consistency": "green",
    "Self Reflection": "purple",
    "Work": "orange",
    "Health": "emerald",
    "Sleep": "indigo",
    "Family": "pink",
    "Goals": "violet"
}


def get_tag_color(tag: str) -> str:
    """Get color for a tag"""
    return TAG_COLORS.get(tag, "violet")  # Default to violet for custom tags
