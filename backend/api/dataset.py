from fastapi import APIRouter, HTTPException
from .models import DatasetListResponse
from services import dataset_service


router = APIRouter()


@router.get("/list", response_model=DatasetListResponse)
async def get_available_datasets():
    try:
        datasets = await dataset_service.get_available_datasets()
        return DatasetListResponse(datasets=datasets)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
