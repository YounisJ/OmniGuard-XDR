import torch
import copy

class FederatedServer:
    """
    The central intelligence aggregator for the OmniGuard XDR platform.
    Receives gradient/weight updates from edge nodes and applies defense algorithms.
    """
    def __init__(self, global_model: torch.nn.Module):
        self.global_model = global_model
        
    def get_global_weights(self):
        return self.global_model.state_dict()
        
    def aggregate_fedavg(self, local_weights_list):
        """
        Standard Federated Averaging (FedAvg).
        Vulnerable to model poisoning if an edge node is compromised by an adversary.
        """
        if not local_weights_list:
            return self.get_global_weights()
            
        # Initialize averaged weights with the first node's weights
        avg_weights = copy.deepcopy(local_weights_list[0])
        
        for key in avg_weights.keys():
            for i in range(1, len(local_weights_list)):
                avg_weights[key] += local_weights_list[i][key]
            # Divide by total number of nodes to get the mean
            avg_weights[key] = torch.div(avg_weights[key], len(local_weights_list))
            
        # Update the global model
        self.global_model.load_state_dict(avg_weights)
        print("🌍 [Global Server] Completed FedAvg Aggregation.")
        return avg_weights
        
    def aggregate_fedmedian(self, local_weights_list):
        """
        Byzantine Fault Tolerant Aggregation (FedMedian).
        Resistant to single-node data/model poisoning attacks.
        """
        if not local_weights_list:
            return self.get_global_weights()
            
        median_weights = copy.deepcopy(local_weights_list[0])
        
        for key in median_weights.keys():
            # Stack weights from all clients for the specific layer
            layer_weights = torch.stack([weights[key] for weights in local_weights_list], dim=0)
            # Take the median across the client dimension (dim=0)
            median_weights[key], _ = torch.median(layer_weights, dim=0)
            
        self.global_model.load_state_dict(median_weights)
        print("🛡️ [Global Server] Completed Byzantine-Tolerant FedMedian Aggregation. Malicious gradients dropped.")
        return median_weights
