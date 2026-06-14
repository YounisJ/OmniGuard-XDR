import urllib.request
import json
import time

def simulate_poisoning_attack():
    endpoint = 'http://localhost:8000/api/federated/sync'
    payload = {
        "is_poisoned": True,
        "node_id": "EVIL_NODE_404"
    }
    json_data = json.dumps(payload).encode('utf-8')
    
    print("🚀 Initiating Simulated Model Poisoning Attack on Global Server...")
    print("Transmitting inflated gradients from EVIL_NODE_404...")
    time.sleep(1)
    
    try:
        req = urllib.request.Request(endpoint, data=json_data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"Server Response: {result}")
            if result.get('status') == 'rejected':
                print("❌ Attack FAILED! The FedMedian algorithm successfully mitigated the poisoning attempt.")
            else:
                print("🔥 Attack SUCCESS! The global model is corrupted.")
    except Exception as e:
        print(f"Failed to connect to server: {e}")

if __name__ == "__main__":
    simulate_poisoning_attack()
