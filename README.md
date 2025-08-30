

🔹 1. Create a virtual environment

Navigate to your project folder in terminal / PowerShell / cmd:

bash
cd your_project_folder


Then create a virtual environment:

bash
# Windows
python -m venv .venv


🔹 2. Activate the environment

bash
# Windows (PowerShell)
.venv\Scripts\Activate

# Windows (cmd)
.venv\Scripts\activate.bat


You should now see `(.venv)` at the start of your terminal prompt ✅


 🔹 3. Install dependencies from `requirements.txt`

Make sure `requirements.txt` exists in your repo, then run:

bash
pip install -r requirements.txt


 🔹 4. Run your project

Finally, start your server:

bash
python run_server.py
