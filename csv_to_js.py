import csv
import json
import os

def main():
    csv_file = "myanmar_earthquakes.csv"
    js_file = "data.js"
    
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found!")
        return
        
    print(f"Reading {csv_file}...")
    records = []
    with open(csv_file, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse numeric fields to float/int to keep data clean
            try:
                row['latitude'] = float(row['latitude'])
                row['longitude'] = float(row['longitude'])
                row['depth'] = float(row['depth'])
                row['mag'] = float(row['mag'])
                
                # Optional parse numeric errors if they exist
                for key in ['gap', 'dmin', 'rms', 'horizontalError', 'depthError', 'magError']:
                    if key in row and row[key]:
                        try:
                            row[key] = float(row[key])
                        except ValueError:
                            pass
                for key in ['nst', 'magNst']:
                    if key in row and row[key]:
                        try:
                            row[key] = int(row[key])
                        except ValueError:
                            pass
            except ValueError as e:
                print(f"Warning parsing row: {e}")
                
            records.append(row)
            
    print(f"Successfully loaded {len(records)} earthquake events.")
    
    # Sort records chronologically (oldest to newest) for smooth timeline animations,
    # or newest to oldest. Let's keep them newest to oldest for lists, but sortable in JS.
    # The time column format: "2026-05-18T02:05:24.327Z"
    records.sort(key=lambda x: x.get('time', ''), reverse=True)
    
    print(f"Writing parsed JSON to {js_file}...")
    with open(js_file, mode="w", encoding="utf-8") as f:
        f.write("// aegis_myanmar_earthquake_data\n")
        f.write("// This file is auto-generated from myanmar_earthquakes.csv to support CORS-free local execution.\n")
        f.write("const EARTHQUAKE_DATA = ")
        json.dump(records, f, indent=2, ensure_ascii=False)
        f.write(";\n")
        
    print(f"Conversion complete! Created {js_file} with {len(records)} records.")

if __name__ == "__main__":
    main()
