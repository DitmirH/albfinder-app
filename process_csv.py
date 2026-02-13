import pandas as pd
import json

# Read CSV
df = pd.read_csv('data.csv')

# Function to parse JSON and expand
def expand_ai_input(json_str):
    try:
        data = json.loads(json_str)
    except:
        return {}
    
    result = {}
    
    # Simple fields
    for key in ['website', 'address_is_trading_premises', 'notes']:
        result[key] = data.get(key, '')
    
    # Array fields - join with semicolon
    for key in ['emails', 'phones', 'listing_urls']:
        val = data.get(key, [])
        if isinstance(val, list):
            result[key] = '; '.join(str(v) for v in val) if val else ''
        else:
            result[key] = ''
    
    # Nested social_media
    sm = data.get('social_media', {})
    if sm:
        for platform in ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']:
            result[f'social_media_{platform}'] = sm.get(platform, '') or ''
    else:
        for platform in ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']:
            result[f'social_media_{platform}'] = ''
    
    return result

# Apply
expanded_data = df['ai_input'].apply(expand_ai_input)
expanded_df = pd.DataFrame(expanded_data.tolist())

# Combine
df = df.drop('ai_input', axis=1)
df = pd.concat([df, expanded_df], axis=1)

# Save
df.to_csv('data_expanded.csv', index=False)

print("Done!")
print(f"New columns: {expanded_df.columns.tolist()}")
print(f"Total rows: {len(df)}")
