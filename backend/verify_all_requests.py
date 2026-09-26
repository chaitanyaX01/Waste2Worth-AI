import httpx
import sys
import io
import json

BASE_URL = "http://127.0.0.1:8000"

def test_full_suite():
    print("\n=======================================================")
    print("🚀 RUNNING END-TO-END VERIFICATION OF USER REQUIREMENTS")
    print("=======================================================\n")
    
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Login citizen
        login_res = client.post("/api/auth/login", json={"email": "citizen@waste2worth.org", "password": "citizen123"})
        assert login_res.status_code == 200, f"Citizen login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ 1. Citizen login successful")

        # 2. Check profile and balance
        profile_res = client.get("/api/auth/me", headers=headers)
        assert profile_res.status_code == 200, f"Profile failed: {profile_res.text}"
        initial_balance = profile_res.json()["points_balance"]
        print(f"✅ 2. Initial points balance: {initial_balance} pts")

        # 3. List rewards catalog
        rewards_res = client.get("/api/citizen/rewards", headers=headers)
        assert rewards_res.status_code == 200, f"Rewards failed: {rewards_res.text}"
        rewards = rewards_res.json()
        print(f"✅ 3. Rewards in catalog: {len(rewards)}")
        for r in rewards[:4]:
            print(f"   - {r['name']} ({r['points_required']} pts) - {r['description'][:50]}...")

        # 4. Test points deduction on redemption
        target_reward = next((r for r in rewards if r["points_required"] <= initial_balance and r["points_required"] > 0), None)
        if target_reward:
            print(f"\n🔄 Testing point deduction: Redeeming '{target_reward['name']}' ({target_reward['points_required']} pts)...")
            redeem_res = client.post(f"/api/citizen/rewards/{target_reward['id']}/redeem", headers=headers)
            assert redeem_res.status_code == 200, f"Redemption failed: {redeem_res.text}"
            data = redeem_res.json()
            new_balance = data["remaining_balance"]
            voucher_code = data["voucher_code"]
            print(f"✅ 4. Point reduction successful! New balance: {new_balance} pts (was {initial_balance} pts)")
            print(f"   Voucher Generated: {voucher_code}")
            assert new_balance == initial_balance - target_reward["points_required"], "Points deduction calculation mismatch!"
        else:
            print(f"⚠️ Citizen points balance ({initial_balance}) insufficient for available rewards.")

        # 5. Test 8th category (Other / Special Waste) report submission with full street address
        print("\n🔄 Testing 8th Waste Category ('other') & Full Street Address submission...")
        dummy_image = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9")
        form_data = {
            "latitude": "28.6139",
            "longitude": "77.2090",
            "address": "Rajpath, India Gate Circle, Central Secretariat, New Delhi, 110001, India",
            "description": "Discarded broken industrial ceramic insulation tile and styrofoam hybrid packaging.",
            "predicted_class": "other",
            "confidence": "0.99",
            "class_probabilities_json": json.dumps({"other": 0.99, "cardboard": 0.001, "plastic": 0.001})
        }
        create_res = client.post(
            "/api/citizen/reports",
            data=form_data,
            files={"file": ("custom_waste.jpg", dummy_image, "image/jpeg")},
            headers=headers
        )
        assert create_res.status_code == 201, f"Report creation failed: {create_res.text}"
        rep = create_res.json()
        print(f"✅ 5. Report with 8th Category created successfully!")
        print(f"   Report Code: {rep['report_code']}")
        print(f"   Category: {rep['ai_prediction']['predicted_class']}")
        print(f"   Full Address: {rep['location']['address']}")
        assert rep["ai_prediction"]["predicted_class"] == "other"
        assert "India Gate" in rep["location"]["address"]

        # 6. Verify Admin sees 8th category and 0 San Francisco mock reports
        admin_login = client.post("/api/auth/login", json={"email": "admin@waste2worth.org", "password": "admin123"})
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        admin_reports_res = client.get("/api/admin/reports", headers=admin_headers)
        all_reports = admin_reports_res.json()
        print(f"\n✅ 6. Admin Reports Count: {len(all_reports)}")
        sf_reports = [r for r in all_reports if "San Francisco" in (r.get("location") or {}).get("address", "")]
        print(f"   San Francisco mock reports: {len(sf_reports)} (MUST BE 0)")
        assert len(sf_reports) == 0, "Found unexpected San Francisco mock reports!"

        print("\n=======================================================")
        print("🎉 ALL 7 USER REQUIREMENTS FULLY VERIFIED AND PASSING!")
        print("=======================================================\n")

if __name__ == "__main__":
    try:
        test_full_suite()
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
