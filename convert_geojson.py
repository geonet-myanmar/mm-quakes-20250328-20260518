import json
import os

def main():
    geojson_file = "Myanmar_Tectonic_Map_2011.geojson"
    js_file = "tectonics.js"
    
    if not os.path.exists(geojson_file):
        print(f"Error: {geojson_file} not found!")
        return
        
    print(f"Reading {geojson_file}...")
    with open(geojson_file, mode="r", encoding="utf-8") as f:
        data = json.load(f)
        
    print(f"Successfully loaded GeoJSON FeatureCollection with {len(data.get('features', []))} features.")
    
    print(f"Writing to {js_file}...")
    with open(js_file, mode="w", encoding="utf-8") as f:
        f.write("// aegis_myanmar_tectonic_data\n")
        f.write("// This file is auto-generated from Myanmar_Tectonic_Map_2011.geojson to support CORS-free local execution.\n")
        f.write("const TECTONIC_DATA = ")
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write(";\n")
        
    print(f"Conversion complete! Created {js_file}.")

if __name__ == "__main__":
    main()
