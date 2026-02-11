from typing import Dict
from sklearn.datasets import load_iris, load_wine, load_breast_cancer, load_digits
from sklearn.model_selection import train_test_split

from models.dataset import Dataset, PredefinedDataset, DatasetInfo


class DatasetService:
    """Service for loading and managing datasets."""

    def __init__(self):
        self._predefined_loaders = {
            "iris": self._load_iris,
            "wine": self._load_wine,
            "breast_cancer": self._load_breast_cancer,
            "digits": self._load_digits,
        }

    def _load_iris(self) -> Dataset:
        """Load the iris dataset."""
        data = load_iris()
        return Dataset(
            X=data.data.tolist(),
            y=data.target.tolist(),
            feature_names=list(data.feature_names),
            target_names=list(data.target_names),
            info=DatasetInfo(
                name="Iris",
                description="Classic iris flower classification dataset",
                n_samples=150,
                n_features=4,
                n_classes=3,
                target_type="classification"
            )
        )

    def _load_wine(self) -> Dataset:
        """Load the wine dataset."""
        data = load_wine()
        return Dataset(
            X=data.data.tolist(),
            y=data.target.tolist(),
            feature_names=list(data.feature_names),
            target_names=list(data.target_names),
            info=DatasetInfo(
                name="Wine",
                description="Wine recognition dataset",
                n_samples=178,
                n_features=13,
                n_classes=3,
                target_type="classification"
            )
        )

    def _load_breast_cancer(self) -> Dataset:
        """Load the breast cancer dataset."""
        data = load_breast_cancer()
        return Dataset(
            X=data.data.tolist(),
            y=data.target.tolist(),
            feature_names=list(data.feature_names),
            target_names=list(data.target_names),
            info=DatasetInfo(
                name="Breast Cancer",
                description="Breast cancer wisconsin diagnostic dataset",
                n_samples=569,
                n_features=30,
                n_classes=2,
                target_type="classification"
            )
        )

    def _load_digits(self) -> Dataset:
        """Load the digits dataset."""
        data = load_digits()
        return Dataset(
            X=data.data.tolist(),
            y=data.target.tolist(),
            feature_names=[f"pixel_{i}" for i in range(64)],
            target_names=[str(i) for i in range(10)],
            info=DatasetInfo(
                name="Digits",
                description="Handwritten digits dataset (8x8 images)",
                n_samples=1797,
                n_features=64,
                n_classes=10,
                target_type="classification"
            )
        )

    async def load_predefined_dataset(self, dataset_ref: PredefinedDataset) -> Dataset:
        """Load a predefined dataset."""
        if dataset_ref.name not in self._predefined_loaders:
            raise ValueError(f"Unknown dataset: {dataset_ref.name}")

        dataset = self._predefined_loaders[dataset_ref.name]()

        # Override test_size and random_state from the reference
        dataset.test_size = dataset_ref.test_size
        dataset.random_state = dataset_ref.random_state

        return dataset

    async def prepare_dataset_for_training(self, dataset: Dataset) -> Dict[str, any]:
        """Prepare dataset for ML training with train/test split."""
        X, y = dataset.to_numpy()

        if dataset.test_size == 0:
            # "Representation Mode": Use the full set for both training and testing
            X_train, X_test, y_train, y_test = X, X, y, y
        else:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=dataset.test_size,
                random_state=dataset.random_state
            )

        return {
            "X": X,
            "y": y,
            "X_train": X_train,
            "X_test": X_test,
            "y_train": y_train,
            "y_test": y_test,
            "feature_names": dataset.get_feature_names(),
            "target_names": dataset.get_target_names(),
            "info": dataset.generate_info()
        }

    async def get_available_datasets(self) -> Dict[str, DatasetInfo]:
        """Get information about all available predefined datasets."""
        datasets_info = {}

        for name in self._predefined_loaders:
            dataset = self._predefined_loaders[name]()
            datasets_info[name] = dataset.info

        return datasets_info

    async def validate_custom_dataset(self, dataset_data: Dict) -> Dataset:
        """Validate and create a Dataset from uploaded data."""
        # This will automatically validate using Pydantic
        return Dataset(**dataset_data)


# Global dataset service instance
dataset_service = DatasetService()
