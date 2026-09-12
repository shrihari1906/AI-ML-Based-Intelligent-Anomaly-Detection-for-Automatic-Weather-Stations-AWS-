import os
import pandas as pd

def get_file_path(filename):
    candidates = [
        os.path.join("..", "raw_data", filename),
        os.path.join("raw_data", filename),
        os.path.join("..", filename),
        filename
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    raise FileNotFoundError(f"Cannot find {filename} in ../raw_data/, raw_data/, or current directory.")

def main():
    city = "San Diego"
    print(f"Preparing data for city: {city}")

    files = {
        "temperature": get_file_path("temperature.csv"),
        "humidity": get_file_path("humidity.csv"),
        "pressure": get_file_path("pressure.csv"),
        "wind_speed": get_file_path("wind_speed.csv")
    }

    dfs = []
    for feature, path in files.items():
        print(f"Loading {feature} from {path}...")
        df_feature = pd.read_csv(path, usecols=["datetime", city])
        df_feature = df_feature.rename(columns={city: feature})
        dfs.append(df_feature)

    # Merge all into one dataframe on "datetime"
    print("Merging dataframes on 'datetime'...")
    df_merged = dfs[0]
    for df_next in dfs[1:]:
        df_merged = pd.merge(df_merged, df_next, on="datetime", how="inner")

    # Convert datetime column to proper datetime type and sort by it
    print("Converting datetime and sorting...")
    df_merged["datetime"] = pd.to_datetime(df_merged["datetime"])
    df_merged = df_merged.sort_values("datetime").reset_index(drop=True)

    # Forward-fill then back-fill missing values, drop any still missing
    print("Handling missing values (ffill then bfill)...")
    df_merged = df_merged.ffill().bfill()
    df_merged = df_merged.dropna().reset_index(drop=True)

    # Convert temperature from Kelvin to Celsius (subtract 273.15)
    print("Converting temperature from Kelvin to Celsius...")
    df_merged["temperature"] = (df_merged["temperature"] - 273.15).round(2)

    # Save the result as clean_weather_data.csv
    output_path = "clean_weather_data.csv"
    df_merged.to_csv(output_path, index=False)
    print(f"Saved cleaned data to {output_path}")

    # Print final row count and preview
    print("\n" + "=" * 50)
    print("CLEANED WEATHER DATA SUMMARY")
    print("=" * 50)
    print(f"Total Rows: {len(df_merged)}")
    print(f"Columns: {list(df_merged.columns)}")
    print("\nPreview (first 5 rows):")
    print(df_merged.head())
    print("\nPreview (last 5 rows):")
    print(df_merged.tail())
    print("\nMissing values check:")
    print(df_merged.isnull().sum())

if __name__ == "__main__":
    main()
