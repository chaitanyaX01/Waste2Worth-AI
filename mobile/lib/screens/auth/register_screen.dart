import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _employeeCodeController = TextEditingController();
  final _serviceAreaController = TextEditingController();

  String _selectedRole = 'CITIZEN';
  bool _obscurePassword = true;
  bool _codeSent = false;
  bool _isSendingOtp = false;
  int _secondsRemaining = 60;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _employeeCodeController.dispose();
    _serviceAreaController.dispose();
    super.dispose();
  }

  void _startTimer() {
    setState(() => _secondsRemaining = 60);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() => _secondsRemaining--);
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _handleSendOtp() async {
    final cleanPhone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    if (cleanPhone.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit mobile number.')),
      );
      return;
    }

    setState(() => _isSendingOtp = true);
    final auth = context.read<AuthProvider>();
    final ok = await auth.sendOtp(cleanPhone);
    setState(() => _isSendingOtp = false);

    if (ok) {
      setState(() => _codeSent = true);
      _startTimer();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('WhatsApp OTP sent to +91 $cleanPhone. Check your WhatsApp messages!'),
            backgroundColor: AppColors.emeraldDark,
          ),
        );
      }
    } else {
      if (mounted && auth.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auth.errorMessage!),
            backgroundColor: AppColors.rejected,
          ),
        );
      }
    }
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_codeSent) {
      await _handleSendOtp();
      return;
    }

    if (_otpController.text.trim().length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit OTP code received on your phone.')),
      );
      return;
    }

    final auth = context.read<AuthProvider>();

    final success = await auth.register(
      name: _nameController.text,
      email: _emailController.text,
      password: _passwordController.text,
      phone: _phoneController.text,
      otpCode: _otpController.text.trim(),
      role: _selectedRole,
      employeeCode: _selectedRole == 'COLLECTOR' ? _employeeCodeController.text : null,
      serviceArea: _selectedRole == 'COLLECTOR' ? _serviceAreaController.text : null,
    );

    if (success && mounted) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Join Waste2Worth',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Start reporting neighborhood waste, earning EcoPoints, and tracking collection efforts.',
                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),

                if (auth.errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFF87171)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Color(0xFFB91C1C), size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            auth.errorMessage!,
                            style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Role Selector
                const Text(
                  'Select Your Role',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_outline, size: 16),
                            SizedBox(width: 6),
                            Text('Citizen'),
                          ],
                        ),
                        selected: _selectedRole == 'CITIZEN',
                        selectedColor: AppColors.emeraldLight,
                        onSelected: (val) => setState(() => _selectedRole = 'CITIZEN'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ChoiceChip(
                        label: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.local_shipping_outlined, size: 16),
                            SizedBox(width: 6),
                            Text('Collector'),
                          ],
                        ),
                        selected: _selectedRole == 'COLLECTOR',
                        selectedColor: AppColors.emeraldLight,
                        onSelected: (val) => setState(() => _selectedRole = 'COLLECTOR'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _nameController,
                  label: 'Full Name',
                  hint: 'Alex Morgan',
                  prefixIcon: Icons.person_outline,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Enter your full name';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hint: 'name@example.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Enter your email address';
                    if (!v.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _phoneController,
                  label: 'Mobile Phone Number (10 digits)',
                  hint: '9876543210',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  readOnly: _codeSent,
                  validator: (v) {
                    final clean = (v ?? '').replaceAll(RegExp(r'\D'), '');
                    if (clean.length != 10) return 'Must be exactly 10 digits';
                    return null;
                  },
                ),
                const SizedBox(height: 8),

                if (!_codeSent) ...[
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: _isSendingOtp ? null : _handleSendOtp,
                      icon: _isSendingOtp
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.send_rounded, size: 16),
                      label: Text(_isSendingOtp ? 'Sending OTP...' : 'Send SMS OTP'),
                    ),
                  ),
                ],

                if (_codeSent) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.emeraldLight.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.emeraldPrimary.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.check_circle_outline, color: AppColors.emeraldDark, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'OTP sent to +91 ${_phoneController.text}',
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                            ),
                            TextButton(
                              onPressed: () => setState(() => _codeSent = false),
                              child: const Text('Change', style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        CustomTextField(
                          controller: _otpController,
                          label: 'Enter 6-Digit OTP Code',
                          hint: '123456',
                          prefixIcon: Icons.shield_outlined,
                          keyboardType: TextInputType.number,
                          validator: (v) {
                            if (_codeSent && (v == null || v.trim().length < 4)) {
                              return 'Enter the OTP code received';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _secondsRemaining > 0 ? 'Resend in ${_secondsRemaining}s' : 'Didn\'t get OTP?',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                            if (_secondsRemaining == 0)
                              TextButton(
                                onPressed: _isSendingOtp ? null : _handleSendOtp,
                                child: const Text('Resend Code', style: TextStyle(fontSize: 12)),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                if (_selectedRole == 'COLLECTOR') ...[
                  CustomTextField(
                    controller: _employeeCodeController,
                    label: 'Employee Badge Code',
                    hint: 'COL-101',
                    prefixIcon: Icons.badge_outlined,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Enter your employee badge code';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    controller: _serviceAreaController,
                    label: 'Assigned Service Area',
                    hint: 'Downtown & Central Sector',
                    prefixIcon: Icons.map_outlined,
                  ),
                  const SizedBox(height: 16),
                ],

                CustomTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: 'Create a strong password (min 6 chars)',
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscurePassword,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      size: 20,
                      color: AppColors.textMuted,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  validator: (v) {
                    if (v == null || v.length < 6) return 'Password must be at least 6 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                CustomButton(
                  text: !_codeSent ? 'Verify Phone & Continue' : 'Complete Registration',
                  isLoading: auth.isLoading || _isSendingOtp,
                  onPressed: _handleRegister,
                ),
                const SizedBox(height: 16),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Already registered?', style: TextStyle(color: AppColors.textSecondary)),
                    TextButton(
                      onPressed: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                      },
                      child: const Text('Log In'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
