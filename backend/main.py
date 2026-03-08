import fastapi
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import uvicorn

app = fastapi.FastAPI()

# CORS: The bridge that allows your React frontend to talk to this Python engine
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Finance Sentinel Backend Operational"}

@app.post("/upload")
async def upload_finance_csv(file: fastapi.UploadFile = fastapi.File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Clean column names (removes sneaky spaces like " Amount")
        df.columns = df.columns.str.strip()
        
        if 'Amount' in df.columns and 'Category' in df.columns:
            # Ensure Amount is numeric
            df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0)
            
            # 1. Total Balance (Sum of actual positive/negative values)
            total_balance = float(df['Amount'].sum())
            
            # 2. Chart Data (Sum of Absolute values per category)
            df['AbsAmount'] = df['Amount'].abs()
            summary = df.groupby('Category')['AbsAmount'].sum().reset_index()
            
            # Rename for React Frontend (name/amount)
            summary.columns = ['name', 'amount']
            chart_data = summary.to_dict(orient='records')
            
            return {
                "status": "success",
                "chart_data": chart_data,
                "total_balance": total_balance
            }
        
        return {"status": "error", "message": "CSV must contain 'Amount' and 'Category' columns."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    # Using 127.0.0.1 specifically for Mac compatibility
    uvicorn.run(app, host="127.0.0.1", port=8000)