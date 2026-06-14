import json
import time
import pandas as pd
import os
import urllib.request

columns = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 'land', 'wrong_fragment', 
    'urgent', 'hot', 'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell', 'su_attempted', 
    'num_root', 'num_file_creations', 'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login', 
    'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 
    'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count', 
    'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate', 
    'dst_host_serror_rate', 'dst_host_srv_serror_rate', 'dst_host_rerror_rate', 'dst_host_srv_rerror_rate', 
    'label', 'difficulty'
]

def ingest_network_data(filepath, endpoint='http://localhost:8000/api/ingest'):
    print(f"Starting ingestion from {filepath} to FastAPI endpoint '{endpoint}'...")
    if not os.path.exists(filepath):
        print(f"Error: Could not find {filepath}")
        return
        
    df = pd.read_csv(filepath, names=columns)
    
    for index, row in df.iterrows():
        record = row.to_dict()
        json_data = json.dumps(record).encode('utf-8')
        
        # Post directly to FastAPI backend without Kafka
        try:
            req = urllib.request.Request(endpoint, data=json_data, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as response:
                pass
        except Exception as e:
            print(f"Failed to send packet to server (is it running?): {e}")
            time.sleep(2) # Backoff if server is down
            continue
        
        # Simulate real-time data stream
        time.sleep(0.01)
        
        if index > 0 and index % 1000 == 0:
            print(f"Ingested {index} records...")

if __name__ == "__main__":
    dataset_path = r"C:\Users\User\Desktop\Side Projects\datasets\NSL-KDD\KDDTrain+_20Percent.txt"
    try:
        ingest_network_data(dataset_path)
    except KeyboardInterrupt:
        print("Ingestion stopped.")
