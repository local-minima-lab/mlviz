import inspect
import json
from datetime import datetime

from flasgger import swag_from
from flask import Blueprint, jsonify, make_response, request
import numpy as np
from sklearn.datasets import load_iris
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

from utils import parse_parameters_from_doc

# Default iris dataset
iris = load_iris()
default_X = iris["data"]
default_y = iris["target"]
default_feature_names = iris["feature_names"]
default_target_names = iris["target_names"].tolist()
default_X_train, default_X_test, default_y_train, default_y_test = train_test_split(
    default_X, default_y, random_state=2025)

models_cache = {}


def tree_to_dict(tree, feature_names=None, X_data=None, y_data=None):
    """
    Convert decision tree to dictionary with optional histogram data.

    Args:
        tree: Trained decision tree
        feature_names: List of feature names
        X_data: Training feature data for histogram generation
        y_data: Training labels for histogram generation
    """
    def get_histogram_data(sample_indices, feature_idx, threshold=None):
        """Generate histogram data for samples at a node."""
        if len(sample_indices) == 0 or X_data is None or y_data is None:
            return None

        feature_values = X_data[sample_indices, feature_idx]
        class_labels = y_data[sample_indices]

        # Create bins for the histogram
        min_val, max_val = feature_values.min(), feature_values.max()
        if min_val == max_val:
            bins = [min_val - 0.1, min_val + 0.1]
        else:
            bins = np.linspace(min_val, max_val, min(
                10, len(sample_indices)) + 1)

        # Get unique classes
        unique_classes = np.unique(y_data)

        # Count samples per bin per class
        counts_by_class = {}
        for class_label in unique_classes:
            class_mask = class_labels == class_label
            class_values = feature_values[class_mask]
            counts, _ = np.histogram(class_values, bins=bins)
            counts_by_class[str(class_label)] = counts.tolist()

        return {
            "feature_values": feature_values.tolist(),
            "class_labels": class_labels.tolist(),
            "bins": bins.tolist(),
            "counts_by_class": counts_by_class,
            "threshold": threshold,
            "total_samples": len(sample_indices)
        }

    def recurse(node_id, sample_indices=None):
        # Initialize sample indices for root node
        if sample_indices is None and X_data is not None:
            sample_indices = np.arange(len(X_data))

        left_child = tree.children_left[node_id]
        right_child = tree.children_right[node_id]

        if left_child == right_child:
            return {
                "type": "leaf",
                "value": tree.value[node_id].tolist(),
                "samples": int(tree.n_node_samples[node_id]),
                "impurity": float(tree.impurity[node_id]),
                "histogram_data": None,
            }

        feature_idx = tree.feature[node_id]
        feature_name = (
            feature_names[feature_idx]
            if feature_names
            else f"feature_{feature_idx}"
        )
        threshold = float(tree.threshold[node_id])

        # Generate histogram data for this split node
        histogram_data = get_histogram_data(
            sample_indices, feature_idx, threshold)

        # Split samples for left and right children
        left_indices = right_indices = None
        if sample_indices is not None and X_data is not None:
            feature_values = X_data[sample_indices, feature_idx]
            left_mask = feature_values <= threshold
            left_indices = sample_indices[left_mask]
            right_indices = sample_indices[~left_mask]

        return {
            "type": "split",
            "feature": feature_name,
            "feature_index": int(feature_idx),
            "threshold": threshold,
            "samples": int(tree.n_node_samples[node_id]),
            "impurity": float(tree.impurity[node_id]),
            "value": tree.value[node_id].tolist(),
            "histogram_data": histogram_data,
            "left": recurse(left_child, left_indices),
            "right": recurse(right_child, right_indices),
        }

    return recurse(0)


def get_dataset_info(dataset=None):
    """
    Get dataset information. If dataset is None, defaults to iris.

    Args:
        dataset: None for iris, or dict with X, y, feature_names, target_names

    Returns:
        Dictionary with dataset info and train/test splits
    """
    if dataset is None:
        # Default to iris
        X = default_X
        y = default_y
        feature_names = default_feature_names
        target_names = default_target_names
        X_train, X_test, y_train, y_test = default_X_train, default_X_test, default_y_train, default_y_test
    else:
        # Custom dataset
        X = np.array(dataset["X"])
        y = np.array(dataset["y"])
        feature_names = dataset.get(
            "feature_names", [f"feature_{i}" for i in range(X.shape[1])])
        target_names = dataset.get(
            "target_names", [str(i) for i in np.unique(y)])

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, random_state=dataset.get("random_state", 2025),
            test_size=dataset.get("test_size", 0.25)
        )

    return {
        "X": X, "y": y,
        "feature_names": feature_names,
        "target_names": target_names,
        "X_train": X_train, "X_test": X_test,
        "y_train": y_train, "y_test": y_test
    }


def set_defaults(data):
    data.setdefault('max_depth', 5)
    return data


bp = Blueprint("dt", __name__, url_prefix="/api/dt")


@bp.route("/get_params", methods=["GET"])
def get_params():
    return make_response(
        jsonify(parse_parameters_from_doc(
            inspect.getdoc(DecisionTreeClassifier)))
    )


@bp.route("/train_model", methods=["POST"])
@swag_from({
    'tags': ['Decision Tree'],
    'summary': 'Train Decision Tree Model',
    'description': 'Trains a Decision Tree Classifier on the Iris dataset with specified parameters. Models are cached based on parameters for efficiency.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                # Removed explicit properties for max_depth/criterion to make it generic
                # Flasgger will infer from `example` or a more generic type
                'additionalProperties': True,  # Allow any other properties
                'properties': {
                    # Example parameters, but the API will accept more
                    # Added x-nullable for None
                    'max_depth': {'type': 'integer', 'description': 'Maximum depth of the tree', 'default': 5, 'minimum': 1, 'x-nullable': True},
                    'criterion': {'type': 'string', 'enum': ['gini', 'entropy'], 'description': 'Split quality criterion', 'default': 'gini'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Model trained successfully or retrieved from cache',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'model_key': {'type': 'string', 'description': 'Key identifying the cached model based on its parameters.'},
                    'cached': {'type': 'boolean', 'description': 'True if the model was retrieved from cache, False if newly trained.'},
                    'metadata': {
                        'type': 'object',
                        'description': 'Metadata about the trained model, including all parameters used.',
                        'properties': {
                            'created_at': {'type': 'string'},
                            # All dynamic parameters will be added here
                        },
                        'additionalProperties': True  # Allow dynamic properties
                    },
                    'tree': {'type': 'object'},
                    'classes': {'type': 'array', 'items': {'type': 'string'}},
                    'matrix': {'type': 'array', 'items': {'type': 'array', 'items': {'type': 'integer'}}},
                    'scores': {
                        'type': 'object',
                        'properties': {
                            'accuracy': {'type': 'number'},
                            'precision': {'type': 'number'},
                            'recall': {'type': 'number'},
                            'f1': {'type': 'number'}
                        }
                    }
                }
            }
        }
    }
})
def train_model():
    data = request.get_json()
    if data is None:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    # Extract dataset if provided, otherwise use default (iris)
    dataset = data.pop("dataset", None)
    data = set_defaults(data)

    # Create model key including dataset info for caching
    model_key = json.dumps(
        {"params": data, "dataset": dataset}, sort_keys=True)
    is_cached = False
    model_data_to_return = None

    if model_key in models_cache:
        model_data_to_return = models_cache[model_key]
        is_cached = True
    else:
        try:
            # Get dataset info
            dataset_info = get_dataset_info(dataset)
            X_train = dataset_info["X_train"]
            X_test = dataset_info["X_test"]
            y_train = dataset_info["y_train"]
            y_test = dataset_info["y_test"]
            feature_names = dataset_info["feature_names"]
            target_names = dataset_info["target_names"]

            # Train model
            valid_params = set(DecisionTreeClassifier().get_params().keys())
            model = DecisionTreeClassifier(
                **{k: v for k, v in data.items() if k in valid_params})
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
        except TypeError as e:
            return jsonify({"success": False, "message": f"Invalid model parameter: {e}"}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Model training failed: {e}"}), 500

        current_time = datetime.now().isoformat()
        accuracy = accuracy_score(y_test, preds)
        precision = precision_score(
            y_test, preds, average="weighted", zero_division=0)
        recall = recall_score(
            y_test, preds, average="weighted", zero_division=0)
        f1 = f1_score(y_test, preds, average="weighted", zero_division=0)
        conf_matrix = confusion_matrix(y_test, preds).tolist()

        model_data_to_return = {
            "model_object": model,
            "dataset_info": dataset_info,
            "model_metadata": {
                "feature_names": feature_names,
                "class_names": target_names,
            },
            "metadata": {
                "created_at": current_time,
                **data
            },
            "tree": tree_to_dict(model.tree_, feature_names, X_train, y_train),
            "classes": target_names,
            "matrix": conf_matrix,
            "scores": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1": f1,
            },
        }
        models_cache[model_key] = model_data_to_return

        print(f"Models cache keys: {list(models_cache.keys())}")

    response_payload = {
        k: v for k, v in model_data_to_return.items() if k not in ['model_object', 'dataset_info']}
    response_payload.update({
        "success": True,
        "model_key": model_key,
        "cached": is_cached,
    })

    response = make_response(jsonify(response_payload))
    return response


@bp.route("/get_predict_params", methods=["POST"])
def get_predict_params():
    data = request.get_json()
    if data is None:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    dataset = data.pop("dataset", None)
    data = set_defaults(data)
    model_key = json.dumps(
        {"params": data, "dataset": dataset}, sort_keys=True)

    model_dict = models_cache.get(model_key, {})
    metadata = model_dict.get("model_metadata", {})
    feature_names = metadata.get("feature_names", [])

    return make_response(jsonify(feature_names))


@bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if data is None:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    # Extract model params and dataset
    model_params = data.get("model", {})
    dataset = model_params.pop("dataset", None)
    model_params = set_defaults(model_params)
    input_data = np.array(data["input"])

    # Create model key
    model_key = json.dumps(
        {"params": model_params, "dataset": dataset}, sort_keys=True)
    model_dict = models_cache.get(model_key, {})

    if not model_dict:
        return jsonify({"success": False, "message": "Model not found. Train model first."}), 404

    metadata = model_dict.get("model_metadata", {})
    class_names = metadata.get("class_names", [])
    model = model_dict["model_object"]

    prediction = model.predict(input_data)

    return make_response(jsonify({
        "prediction": [class_names[p] for p in prediction]
    }))
