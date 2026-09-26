import httpx
import os

BASE_URL = "http://127.0.0.1:8000"

def test_full_pipeline():
    print("==================================================")
    print("Testing Complete Waste2Worth End-to-End Workflow")
    print("==================================================")

    # Load existing sample waste image
    sample_img_path = os.path.join(os.path.dirname(__file__), "uploads", "reports", "sample_waste.jpg")
    with open(sample_img_path, "rb") as f:
        image_bytes = f.read()

    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Citizen login
        print("\n1. Logging in as Citizen...")
        res = client.post("/api/auth/login", json={
            "email": "citizen@waste2worth.org",
            "password": "citizen123"
        })
        assert res.status_code == 200, f"Login failed: {res.text}"
        citizen_token = res.json()["access_token"]
        citizen_headers = {"Authorization": f"Bearer {citizen_token}"}
        me_init = client.get("/api/auth/me", headers=citizen_headers).json()
        initial_points = me_init["points_balance"]
        print(f"   ✓ Logged in as: {me_init['name']} | Initial points: {initial_points}")

        # 2. ResNet18 AI Prediction
        print("\n2. Testing ResNet18 Model Classification (/api/predict)...")
        pred_res = client.post("/api/predict", files={"file": ("test_waste.jpg", image_bytes, "image/jpeg")})
        assert pred_res.status_code == 200, f"Prediction failed: {pred_res.text}"
        pred = pred_res.json()
        print(f"   ✓ AI Predicted: {pred['prediction']} ({pred['confidence']*100:.2f}%)")
        print(f"   ✓ Model: {pred['model_version']}")
        print(f"   ✓ Top 7 Probabilities: {list(pred['all_predictions'].keys())}")

        # 3. Citizen submits new report
        print("\n3. Citizen submitting new waste incident report...")
        data = {
            "latitude": "37.7749",
            "longitude": "-122.4194",
            "address": "Market St & 4th St, San Francisco, CA",
            "description": "Discarded container on sidewalk corner",
            "predicted_class": pred["prediction"],
            "confidence": str(pred["confidence"])
        }
        rep_res = client.post(
            "/api/citizen/reports",
            data=data,
            files={"file": ("street_waste.jpg", image_bytes, "image/jpeg")},
            headers=citizen_headers
        )
        assert rep_res.status_code == 201, f"Report failed: {rep_res.text}"
        report = rep_res.json()
        report_id = report["id"]
        report_code = report["report_code"]
        print(f"   ✓ Created Report: {report_code} (Status: {report['status']})")
        print(f"   ✓ Image stored at: {report['image_url']}")

        # 4. Admin login & verify
        print("\n4. Logging in as Admin...")
        adm_res = client.post("/api/auth/login", json={
            "email": "admin@waste2worth.org",
            "password": "admin123"
        })
        assert adm_res.status_code == 200
        admin_token = adm_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        print(f"   ✓ Admin verifying report {report_code} (+20 pts to citizen)...")
        ver_res = client.patch(
            f"/api/admin/reports/{report_id}/verify",
            json={"status": "VERIFIED", "comment": f"Legitimate recyclable {pred['prediction']} confirmed."},
            headers=admin_headers
        )
        assert ver_res.status_code == 200
        print(f"   ✓ Report verified! New status: {ver_res.json()['status']}")

        # 5. Admin assigns Collector
        print("\n5. Admin dispatching Waste Collector...")
        col_list = client.get("/api/admin/collectors", headers=admin_headers).json()
        collector_id = col_list[0]["id"]
        collector_name = col_list[0]["name"]
        print(f"   Selected Collector: {collector_name} ({col_list[0]['employee_code']})")

        assign_res = client.post(
            f"/api/admin/tasks/assign?report_id={report_id}",
            json={"collector_id": collector_id, "priority": "URGENT"},
            headers=admin_headers
        )
        assert assign_res.status_code == 200
        task = assign_res.json()
        task_id = task["id"]
        print(f"   ✓ Dispatched Task {task_id} with priority: {task['priority']}")

        # 6. Collector login & field updates
        print("\n6. Logging in as Waste Collector...")
        col_auth = client.post("/api/auth/login", json={
            "email": "collector@waste2worth.org",
            "password": "collector123"
        })
        assert col_auth.status_code == 200
        collector_token = col_auth.json()["access_token"]
        collector_headers = {"Authorization": f"Bearer {collector_token}"}

        print("   ✓ Collector transitioning task to IN_PROGRESS...")
        prog_res = client.patch(
            f"/api/collector/tasks/{task_id}/status",
            json={"status": "IN_PROGRESS", "comment": "Collector en route with truck #12"},
            headers=collector_headers
        )
        assert prog_res.status_code == 200

        print("   ✓ Collector uploading BEFORE evidence photo...")
        ev_before = client.post(
            f"/api/collector/tasks/{task_id}/evidence",
            files={"file": ("before_photo.jpg", image_bytes, "image/jpeg")},
            data={"evidence_type": "BEFORE", "notes": "Initial state before cleanup"},
            headers=collector_headers
        )
        assert ev_before.status_code == 201

        print("   ✓ Collector uploading AFTER evidence photo...")
        ev_after = client.post(
            f"/api/collector/tasks/{task_id}/evidence",
            files={"file": ("after_photo.jpg", image_bytes, "image/jpeg")},
            data={"evidence_type": "AFTER", "notes": "Site swept and bagged for recycling"},
            headers=collector_headers
        )
        assert ev_after.status_code == 201

        print("   ✓ Collector marking task COLLECTED...")
        col_res = client.patch(
            f"/api/collector/tasks/{task_id}/status",
            json={"status": "COLLECTED", "comment": "Waste loaded and area cleared."},
            headers=collector_headers
        )
        assert col_res.status_code == 200
        print(f"   ✓ Task status is now: {col_res.json()['status']}")

        # 7. Admin final approval & points grant
        print("\n7. Admin reviewing cleanup proof and granting completion (+50 pts)...")
        comp_res = client.patch(
            f"/api/admin/tasks/{task_id}/verify-completion",
            json={"comment": "Proof photos reviewed. Site restored. Bonus awarded."},
            headers=admin_headers
        )
        assert comp_res.status_code == 200
        print(f"   ✓ Task approved as COMPLETED!")

        # 8. Check Citizen final points
        print("\n8. Checking Citizen final rewards balance...")
        me_res = client.get("/api/auth/me", headers=citizen_headers)
        final_points = me_res.json()["points_balance"]
        points_earned = final_points - initial_points
        print(f"   ✓ Previous balance: {initial_points} pts")
        print(f"   ✓ Final balance:    {final_points} pts")
        print(f"   ✓ Points earned:    +{points_earned} pts (+10 submit + 20 verify + 50 complete)")
        assert points_earned == 80, f"Expected 80 points gained, got {points_earned}"

        print("\n==================================================")
        print("SUCCESS: Full Waste2Worth Competition Lifecycle Verified!")
        print("==================================================")

if __name__ == "__main__":
    test_full_pipeline()
