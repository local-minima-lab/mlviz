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

iris = load_iris()
X = iris["data"]
y = iris["target"]
feature_names = iris["feature_names"]
target_names = iris["target_names"].tolist()

X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=2025)

models_cache = {}


def tree_to_dict(tree, feature_names=None):
    def recurse(node_id):
        left_child = tree.children_left[node_id]
        right_child = tree.children_right[node_id]

        if left_child == right_child:
            return {
                "type": "leaf",
                "value": tree.value[node_id].tolist(),
                "samples": int(tree.n_node_samples[node_id]),
                "impurity": float(tree.impurity[node_id]),
            }

        feature_name = (
            feature_names[tree.feature[node_id]]
            if feature_names
            else f"feature_{tree.feature[node_id]}"
        )

        return {
            "type": "split",
            "feature": feature_name,
            "feature_index": int(tree.feature[node_id]),
            "threshold": float(tree.threshold[node_id]),
            "samples": int(tree.n_node_samples[node_id]),
            "impurity": float(tree.impurity[node_id]),
            "left": recurse(left_child),
            "right": recurse(right_child),
        }

    return recurse(0)


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

    data = set_defaults(data)
    model_key = json.dumps(data, sort_keys=True)
    is_cached = False
    model_data_to_return = None

    if model_key in models_cache:
        model_data_to_return = models_cache[model_key]
        is_cached = True
    else:
        try:
            model = DecisionTreeClassifier(**data)
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
            "model_metadata": {
                "feature_names": feature_names,
                "class_names": target_names,
            },
            "metadata": {
                "created_at": current_time,
                **data
            },
            "tree": tree_to_dict(model.tree_, feature_names),
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
        k: v for k, v in model_data_to_return.items() if k != 'model_object'}
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

    data = set_defaults(data)

    model_dict = models_cache.get(json.dumps(data, sort_keys=True), {})
    metadata = model_dict.get("model_metadata", {})
    feature_names = metadata.get("feature_names", {})

    return make_response(jsonify(feature_names))


@bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if data is None:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    predict(data)
    model_params = set_defaults(data.get("model", {}))
    input_data = np.array(data["input"])

    model_dict = models_cache.get(json.dumps(
        model_params, sort_keys=True), {})

    metadata = model_dict.get("model_metadata", {})
    class_names = metadata.get("class_names", {})
    model = model_dict["model_object"]

    prediction = model.predict(input_data)

    return make_response(jsonify({
        "prediction": [class_names[p] for p in prediction]
    }))
