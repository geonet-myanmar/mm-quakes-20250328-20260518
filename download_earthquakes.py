import urllib.request
import urllib.parse
import csv
import io
import sys

def download_data():
    base_url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    params = {
        "format": "csv",
        "starttime": "2025-03-28",
        "minlatitude": "9.5",
        "maxlatitude": "28.6",
        "minlongitude": "92.1",
        "maxlongitude": "101.2"
    }
    
    url = base_url + "?" + urllib.parse.urlencode(params)
    print(f"Fetching data from URL: {url}")
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            return data
    except Exception as e:
        print(f"Error fetching data: {e}", file=sys.stderr)
        return None

def process_data(csv_text):
    # Parse CSV to inspect and filter
    f = io.StringIO(csv_text)
    reader = csv.DictReader(f)
    
    myanmar_events = []
    other_events = []
    
    for row in reader:
        place = row.get("place", "").lower()
        # Check if "myanmar" or "burma" is in the place name
        if "myanmar" in place or "burma" in place:
            myanmar_events.append(row)
        else:
            other_events.append(row)
            
    print(f"Total events in bounding box: {len(myanmar_events) + len(other_events)}")
    print(f"Events explicitly labeled as Myanmar/Burma: {len(myanmar_events)}")
    print(f"Other events in the bounding box: {len(other_events)}")
    
    # Let's save all events in the bounding box to one file, and the filtered ones to another,
    # or let's inspect the other events to see if any are actually in Myanmar but labeled differently.
    # We will write the Myanmar-labeled ones to myanmar_earthquakes.csv
    # and all bounding box ones to myanmar_bbox_earthquakes.csv.
    
    fieldnames = reader.fieldnames
    
    # Save Myanmar filtered events
    output_filename = "myanmar_earthquakes.csv"
    with open(output_filename, "w", newline="", encoding="utf-8") as out_f:
        writer = csv.DictWriter(out_f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(myanmar_events)
    print(f"Saved filtered events to: {output_filename}")
    
    # Save all bounding box events
    bbox_filename = "myanmar_bounding_box_earthquakes.csv"
    with open(bbox_filename, "w", newline="", encoding="utf-8") as out_f:
        writer = csv.DictWriter(out_f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(myanmar_events + other_events)
    print(f"Saved all bounding box events to: {bbox_filename}")

if __name__ == "__main__":
    csv_data = download_data()
    if csv_data:
        process_data(csv_data)
    else:
        print("Failed to download data.")
