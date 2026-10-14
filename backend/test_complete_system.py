import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_system_tests():
    print("==================================================")
    print("   Waste2Worth Comprehensive System Test Suite    ")
    print("==================================================")

    # 1. Health check & model verification
    print("\n[1] Testing Backend Health & ResNet-18 Model Status...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"   ✓ Health: {health_data['status']} | Model: {health_data['model']} | Device: {health_data['device']}")

    # 2. ResNet18 Waste Classification (/api/predict)
    print("\n[2] Testing ResNet-18 Waste Classification (/api/predict)...")
    sample_img_path = backend_dir / "uploads" / "reports" / "sample_waste.jpg"
    with open(sample_img_path, "rb") as f:
        img_bytes = f.read()

    pred_res = client.post("/api/predict", files={"file": ("waste.jpg", img_bytes, "image/jpeg")})
    assert pred_res.status_code == 200, f"Prediction failed: {pred_res.text}"
    pred_data = pred_res.json()
    print(f"   ✓ Predicted Class: {pred_data['prediction']}")
    print(f"   ✓ Confidence: {pred_data['confidence_percent']}%")
    print(f"   ✓ Model: {pred_data['model_version']}")
    assert len(pred_data["all_predictions"]) == 7, "Must contain all 7 classes"
    print("   ✓ All 7 waste categories evaluated correctly.")

    # 3. Citizen Login & Initial Balance
    print("\n[3] Testing Citizen Authentication (/api/auth/login)...")
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@waste2worth.org",
        "password": "citizen123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    citizen_token = login_res.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    me_res = client.get("/api/auth/me", headers=citizen_headers)
    assert me_res.status_code == 200
    citizen_data = me_res.json()
    initial_points = citizen_data["points_balance"]
    print(f"   ✓ Logged in: {citizen_data['name']} | Role: {citizen_data['role']} | EcoPoints: {initial_points}")

    # 4. Firebase Authentication Verification (/api/auth/firebase-verify)
    print("\n[4] Testing Firebase Authentication ID Token Verification (/api/auth/firebase-verify)...")
    fb_res = client.post("/api/auth/firebase-verify", json={
        "id_token": "firebase_phone_verified_token_123456",
        "phone": "+1-555-0188",
        "name": "Mobile Verified User",
        "role": "CITIZEN"
    })
    assert fb_res.status_code == 200, f"Firebase verify failed: {fb_res.text}"
    fb_token_data = fb_res.json()
    assert "access_token" in fb_token_data
    print(f"   ✓ Firebase Token Verified! User ID: {fb_token_data['user_id']} | Role: {fb_token_data['role']}")

    # 5. Citizen Submits Waste Report (/api/citizen/reports)
    print("\n[5] Testing Citizen Waste Incident Report Submission (/api/citizen/reports)...")
    report_data = {
        "latitude": "37.7749",
        "longitude": "-122.4194",
        "address": "Market St & 4th St, Downtown Civic Center",
        "description": "Discarded electronics and packaging on sidewalk curb",
        "predicted_class": pred_data["prediction"],
        "confidence": str(pred_data["confidence"]),
    }
    rep_res = client.post(
        "/api/citizen/reports",
        data=report_data,
        files={"file": ("incident.jpg", img_bytes, "image/jpeg")},
        headers=citizen_headers
    )
    assert rep_res.status_code == 201, f"Report submission failed: {rep_res.text}"
    report = rep_res.json()
    report_id = report["id"]
    report_code = report["report_code"]
    print(f"   ✓ Report Created: {report_code} | Status: {report['status']}")
    print(f"   ✓ Image stored at: {report['image_url']}")

    # Verify points awarded for submission (+10 pts)
    me_after_submit = client.get("/api/auth/me", headers=citizen_headers).json()
    points_after_submit = me_after_submit["points_balance"]
    assert points_after_submit == initial_points + 10, f"Expected +10 pts, got: {points_after_submit}"
    print(f"   ✓ EcoPoints updated: {initial_points} -> {points_after_submit} (+10 pts awarded)")

    # 6. Admin Verification of Report (/api/admin/reports/{id}/verify)
    print("\n[6] Testing Admin Report Verification (/api/admin/reports/{id}/verify)...")
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@waste2worth.org",
        "password": "admin123"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    ver_res = client.patch(
        f"/api/admin/reports/{report_id}/verify",
        json={"status": "VERIFIED", "comment": "Legitimate hazardous incident confirmed by municipal moderation."},
        headers=admin_headers
    )
    assert ver_res.status_code == 200, f"Verification failed: {ver_res.text}"
    print(f"   ✓ Report {report_code} verified! New Status: {ver_res.json()['status']}")

    # Verify additional verification points awarded to citizen (+20 pts)
    me_after_verify = client.get("/api/auth/me", headers=citizen_headers).json()
    points_after_verify = me_after_verify["points_balance"]
    assert points_after_verify == points_after_submit + 20, f"Expected +20 pts on verify, got: {points_after_verify}"
    print(f"   ✓ EcoPoints updated: {points_after_submit} -> {points_after_verify} (+20 pts awarded)")

    # 7. Admin Assigns Collector Task (/api/admin/tasks/assign)
    print("\n[7] Testing Admin Dispatching Waste Collector (/api/admin/tasks/assign)...")
    col_list = client.get("/api/admin/collectors", headers=admin_headers).json()
    assert len(col_list) > 0, "No collectors available"
    collector = col_list[0]

    assign_res = client.post(
        f"/api/admin/tasks/assign?report_id={report_id}",
        json={"collector_id": collector["id"], "priority": "URGENT"},
        headers=admin_headers
    )
    assert assign_res.status_code == 200, f"Task assignment failed: {assign_res.text}"
    task = assign_res.json()
    task_id = task["id"]
    print(f"   ✓ Task {task_id} dispatched to {collector['name']} (Priority: {task['priority']})")

    # 8. Collector Workflow
    print("\n[8] Testing Waste Collector Field Workflow...")
    col_login = client.post("/api/auth/login", json={
        "email": "collector@waste2worth.org",
        "password": "collector123"
    })
    assert col_login.status_code == 200
    col_token = col_login.json()["access_token"]
    col_headers = {"Authorization": f"Bearer {col_token}"}

    # Collector starts task
    start_res = client.patch(
        f"/api/collector/tasks/{task_id}/status",
        json={"status": "IN_PROGRESS", "comment": "Collector en route to coordinates."},
        headers=col_headers
    )
    assert start_res.status_code == 200
    print(f"   ✓ Task status updated to: {start_res.json()['status']}")

    # Collector uploads cleanup evidence photo
    ev_res = client.post(
        f"/api/collector/tasks/{task_id}/evidence",
        data={"evidence_type": "AFTER", "notes": "Cleaned up and segregated for recovery vehicle."},
        files={"file": ("after_cleanup.jpg", img_bytes, "image/jpeg")},
        headers=col_headers
    )
    assert ev_res.status_code == 201, f"Evidence upload failed: {ev_res.text}"
    print(f"   ✓ Evidence uploaded: {ev_res.json()['evidence_type']} ({ev_res.json()['image_url']})")

    # Collector completes task
    col_comp = client.patch(
        f"/api/collector/tasks/{task_id}/status",
        json={"status": "COLLECTED", "comment": "Cleanup finished and site restored."},
        headers=col_headers
    )
    assert col_comp.status_code == 200
    print(f"   ✓ Task completed by collector! Status: {col_comp.json()['status']}")

    # 9. EcoPoints Rewards Redemption (/api/citizen/rewards/{id}/redeem)
    print("\n[9] Testing EcoPoints Rewards Redemption & Voucher Generation...")
    catalog = client.get("/api/citizen/rewards", headers=citizen_headers).json()
    assert len(catalog) > 0, "Catalog empty"
    affordable_reward = next((r for r in catalog if r["points_required"] <= points_after_verify), catalog[0])

    redeem_res = client.post(
        f"/api/citizen/rewards/{affordable_reward['id']}/redeem",
        headers=citizen_headers
    )
    assert redeem_res.status_code == 200, f"Redemption failed: {redeem_res.text}"
    redeem_data = redeem_res.json()
    print(f"   ✓ Successfully Redeemed: {redeem_data['reward_name']}")
    print(f"   ✓ Digital Voucher Code: {redeem_data['voucher_code']}")
    print(f"   ✓ Points Spent: -{redeem_data['points_spent']} | Remaining Balance: {redeem_data['remaining_balance']}")

    # 10. Predictive Waste Management & Hotspot Identification
    print("\n[10] Testing Predictive Waste Management (/api/predictions/risk-forecast)...")
    pred_risk_res = client.get("/api/predictions/risk-forecast")
    assert pred_risk_res.status_code == 200, f"Risk forecast failed: {pred_risk_res.text}"
    risk_forecast = pred_risk_res.json()
    print(f"   ✓ Model Baseline: {risk_forecast['model_version']}")
    print(f"   ✓ Model Type: {risk_forecast['model_type']}")
    print(f"   ✓ Forecast Horizon: {risk_forecast['forecast_horizon']}")
    print(f"   ✓ Active Geographic Clusters: {risk_forecast['summary']['total_active_clusters']}")
    print(f"   ✓ Urgent Risk Hotspots: {risk_forecast['summary']['urgent_priority_clusters']}")
    for zone in risk_forecast["high_risk_zones"][:3]:
        print(f"      • {zone['address']}: Risk {zone['risk_score']}/100 ({zone['priority_recommendation']}) - {zone['priority_rationale']}")

    print("\n==================================================")
    print("   ✅ ALL 10 END-TO-END PIPELINE TESTS PASSED!    ")
    print("==================================================")

if __name__ == "__main__":
    run_system_tests()
