import torch
import torch.nn as nn
import torch.optim as optim
import copy

class EdgeNode:
    """
    Simulates a geographical edge device (e.g., a regional corporate firewall or IoT hub).
    Each node holds a local instance of the model and trains on its local data silo.
    """
    def __init__(self, node_id: str, model: nn.Module, learning_rate: float = 0.001):
        self.node_id = node_id
        # Keep a separate copy of the global model for this specific edge node
        self.local_model = copy.deepcopy(model)
        self.optimizer = optim.Adam(self.local_model.parameters(), lr=learning_rate)
        
    def set_weights(self, global_weights):
        """Update the local model with the newly aggregated global weights."""
        self.local_model.load_state_dict(copy.deepcopy(global_weights))
        
    def get_weights(self):
        """Return the current local weights to send back to the central server."""
        return self.local_model.state_dict()
        
    def local_train(self, dataloader, epochs=1):
        """
        Simulate local training. In a real system, this happens on the edge device.
        """
        self.local_model.train()
        # Handle Autoencoders (MSE) vs Classifiers (CrossEntropy)
        criterion = nn.MSELoss() if hasattr(self.local_model, 'decoder') else nn.CrossEntropyLoss()
        
        for epoch in range(epochs):
            for batch_data, batch_labels in dataloader:
                self.optimizer.zero_grad()
                
                # Forward pass
                outputs = self.local_model(batch_data)
                
                # Compute loss
                if hasattr(self.local_model, 'decoder'):
                    loss = criterion(outputs, batch_data) # Reconstruction loss
                else:
                    loss = criterion(outputs, batch_labels)
                    
                # Backward pass
                loss.backward()
                self.optimizer.step()
                
        print(f"[EdgeNode {self.node_id}] Completed local training round. Generating weight updates.")
        return self.get_weights()
