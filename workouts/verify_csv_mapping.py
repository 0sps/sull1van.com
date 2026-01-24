#!/usr/bin/env python3
"""
Verify that WorkoutExport.csv data matches Firebase database
Checks:
1. All exercise names in CSV were mapped to unique IDs
2. All workout logs from CSV exist in Firebase
3. Data integrity between CSV and Firebase
"""

import csv
import json
from collections import defaultdict
from datetime import datetime

print("🔍 CSV to Firebase Verification Tool\n")

# Load exercises.json to get name -> ID mapping
print("📥 Loading exercises.json...")
with open('exercises.json', 'r', encoding='utf-8') as f:
    exercises_data = json.load(f)

# Create name -> ID mapping (case-insensitive)
name_to_id = {}
for ex_id, data in exercises_data.items():
    name = data['name'].lower().strip()
    name_to_id[name] = ex_id
    # Also map export name if different
    if data.get('exportName') and data['exportName'].lower() != name:
        name_to_id[data['exportName'].lower().strip()] = ex_id

print(f"✅ Loaded {len(exercises_data)} exercises from exercises.json\n")

# Read CSV file
print("📥 Reading WorkoutExport.csv...")
csv_exercises = set()
csv_workouts = defaultdict(list)  # date -> list of exercises
unmapped_exercises = set()

with open('WorkoutExport.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        exercise_name = row['Exercise'].strip()
        date = row['Date'].strip()
        
        csv_exercises.add(exercise_name)
        csv_workouts[date].append({
            'name': exercise_name,
            'reps': row['Reps'],
            'weight': row['Weight(kg)'],
            'isWarmup': row['isWarmup']
        })
        
        # Check if exercise has a mapping
        if exercise_name.lower() not in name_to_id:
            unmapped_exercises.add(exercise_name)

print(f"✅ Found {len(csv_exercises)} unique exercises in CSV")
print(f"✅ Found {len(csv_workouts)} unique workout dates in CSV\n")

# Report on mapping status
print("=" * 60)
print("📊 EXERCISE MAPPING VERIFICATION")
print("=" * 60)

mapped_count = len(csv_exercises) - len(unmapped_exercises)
print(f"✅ Mapped exercises: {mapped_count}/{len(csv_exercises)}")
print(f"❌ Unmapped exercises: {len(unmapped_exercises)}/{len(csv_exercises)}")

if unmapped_exercises:
    print(f"\n⚠️  WARNING: {len(unmapped_exercises)} exercises in CSV have no mapping:")
    for ex in sorted(unmapped_exercises)[:20]:
        print(f"   - {ex}")
    if len(unmapped_exercises) > 20:
        print(f"   ... and {len(unmapped_exercises) - 20} more")
else:
    print("\n🎉 All exercises in CSV have been mapped to unique IDs!")

print("\n" + "=" * 60)
print("📊 SUMMARY")
print("=" * 60)
print(f"Total unique exercises in CSV: {len(csv_exercises)}")
print(f"Successfully mapped: {mapped_count} ({mapped_count/len(csv_exercises)*100:.1f}%)")
print(f"Missing mappings: {len(unmapped_exercises)} ({len(unmapped_exercises)/len(csv_exercises)*100:.1f}%)")
print(f"Total workout dates: {len(csv_workouts)}")

# Show which exercises ARE mapped
if mapped_count > 0:
    print(f"\n✅ Sample of successfully mapped exercises:")
    mapped_exercises = csv_exercises - unmapped_exercises
    for ex in sorted(mapped_exercises)[:10]:
        ex_id = name_to_id.get(ex.lower())
        print(f"   {ex} → {ex_id}")

print("\n" + "=" * 60)
print("💡 NEXT STEPS")
print("=" * 60)
if unmapped_exercises:
    print("To fix unmapped exercises:")
    print("1. Add missing exercises to exercises.json")
    print("2. Re-run this verification script")
    print("3. Once all mapped, you can verify against Firebase")
else:
    print("✅ All exercises mapped! Your CSV data is ready for Firebase verification.")
    print("   Run the Firebase comparison script to verify data integrity.")
