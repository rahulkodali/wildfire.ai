import tensorflow as tf

def load_model(model_path):
    """
    Load a TensorFlow model from the specified path
    Args:
        model_path: Path to the saved model file (.h5)
    Returns:
        Loaded TensorFlow model
    """
    try:
        model = tf.keras.models.load_model(model_path)
        return model
    except Exception as e:
        print(f"Error loading model from {model_path}: {e}")
        raise 