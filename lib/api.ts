// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface AddWorkerPayload {
  // Basic Information
  emp_no?: string;
  title?: string;
  name: string;
  gender?: string;
  date_of_birth?: string;
  date_of_joining?: string;
  
  // Contact Information
  phone: string;
  email?: string;
  emergency_contact_number?: string;
  
  // Work Information
  designation: string;
  department?: string;
  department_other?: string;
  work_location?: string;
  work_location_other?: string;
  floor?: string;
  floor_other?: string;
  
  // Government IDs
  aadhaar: string;
  pan?: string;
  uan_number?: string;
  esi_number?: string;
  
  // Address Information
  address?: string;
  currently_staying_type?: string;
  permanent_address?: string;
  rental_address?: string;
  
  // Contractor Information
  contractor_id: string;
  contractor_name: string;
  
  // Document Uploads
  passport_photo: File;
  aadhaar_photo: File;
  pan_photo?: File;
}

export interface WorkerResponse {
  success: boolean;
  message: string;
  worker_id?: number;
}

/**
 * Add new worker to the system
 * Sends multipart/form-data to Python FastAPI backend
 */
export async function addWorker(payload: AddWorkerPayload): Promise<WorkerResponse> {
  const formData = new FormData();
  
  // Add all text fields
  if (payload.emp_no) formData.append('emp_no', payload.emp_no);
  if (payload.title) formData.append('title', payload.title);
  formData.append('name', payload.name);
  if (payload.gender) formData.append('gender', payload.gender);
  if (payload.date_of_birth) formData.append('date_of_birth', payload.date_of_birth);
  if (payload.date_of_joining) formData.append('date_of_joining', payload.date_of_joining);
  
  formData.append('phone', payload.phone);
  if (payload.email) formData.append('email', payload.email);
  if (payload.emergency_contact_number) formData.append('emergency_contact_number', payload.emergency_contact_number);
  
  formData.append('designation', payload.designation);
  if (payload.department) formData.append('department', payload.department);
  if (payload.department_other) formData.append('department_other', payload.department_other);
  if (payload.work_location) formData.append('work_location', payload.work_location);
  if (payload.work_location_other) formData.append('work_location_other', payload.work_location_other);
  if (payload.floor) formData.append('floor', payload.floor);
  if (payload.floor_other) formData.append('floor_other', payload.floor_other);
  
  formData.append('aadhaar', payload.aadhaar);
  if (payload.pan) formData.append('pan', payload.pan);
  if (payload.uan_number) formData.append('uan_number', payload.uan_number);
  if (payload.esi_number) formData.append('esi_number', payload.esi_number);
  
  if (payload.address) formData.append('address', payload.address);
  if (payload.currently_staying_type) formData.append('currently_staying_type', payload.currently_staying_type);
  if (payload.permanent_address) formData.append('permanent_address', payload.permanent_address);
  if (payload.rental_address) formData.append('rental_address', payload.rental_address);
  
  formData.append('contractor_id', payload.contractor_id);
  formData.append('contractor_name', payload.contractor_name);
  
  // Add file uploads
  formData.append('passport_photo', payload.passport_photo);
  formData.append('aadhaar_photo', payload.aadhaar_photo);
  if (payload.pan_photo) formData.append('pan_photo', payload.pan_photo);
  
  try {
    const response = await fetch(`${API_BASE_URL}/workers`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
      const errorMessage = error.detail || 'Failed to add worker';
      
      // Throw with specific error messages
      if (response.status === 400) {
        throw new Error(errorMessage);
      } else if (response.status === 403) {
        throw new Error('Permission denied. Check AWS credentials.');
      } else if (response.status === 503) {
        throw new Error('Service temporarily unavailable. Please try again.');
      } else {
        throw new Error(errorMessage);
      }
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Add worker error:', error);
    // Re-throw with user-friendly message
    if (error.message) {
      throw error;
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
}

/**
 * Get all workers with optional filtering
 */
export async function getWorkers(params?: {
  contractor_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
}): Promise<any[]> {
  const searchParams = new URLSearchParams();
  if (params?.contractor_id) searchParams.append('contractor_id', params.contractor_id);
  if (params?.status) searchParams.append('status', params.status);
  
  const url = `${API_BASE_URL}/workers${searchParams.toString() ? `?${searchParams}` : ''}`;
  
  try {
    console.log("🔍 Fetching workers from URL:", url)
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch workers');
    }
    
    const data = await response.json();
    console.log("🔍 Raw API response:", data)
    return data;
  } catch (error) {
    console.error('Get workers error:', error);
    throw error;
  }
}

/**
 * Approve or reject a worker
 */
export async function approveWorker(data: {
  worker_id: number;
  approved: boolean;
  approved_by: string;
  rejection_reason?: string;
}): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update worker status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Approve worker error:', error);
    throw error;
  }
}

/**
 * Get single worker by ID
 */
export async function getWorkerById(workerId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch worker');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get worker error:', error);
    throw error;
  }
}

/**
 * Update worker information
 */
export async function updateWorker(workerId: number, payload: Partial<AddWorkerPayload>): Promise<WorkerResponse> {
  const formData = new FormData();
  
  // Add all fields that are provided
  if (payload.emp_no !== undefined) formData.append('emp_no', payload.emp_no);
  if (payload.title !== undefined) formData.append('title', payload.title);
  if (payload.name !== undefined) formData.append('name', payload.name);
  if (payload.gender !== undefined) formData.append('gender', payload.gender);
  if (payload.date_of_birth !== undefined) formData.append('date_of_birth', payload.date_of_birth);
  if (payload.date_of_joining !== undefined) formData.append('date_of_joining', payload.date_of_joining);
  
  if (payload.phone !== undefined) formData.append('phone', payload.phone);
  if (payload.email !== undefined) formData.append('email', payload.email);
  if (payload.emergency_contact_number !== undefined) formData.append('emergency_contact_number', payload.emergency_contact_number);
  
  if (payload.designation !== undefined) formData.append('designation', payload.designation);
  if (payload.department !== undefined) formData.append('department', payload.department);
  if (payload.department_other !== undefined) formData.append('department_other', payload.department_other);
  if (payload.work_location !== undefined) formData.append('work_location', payload.work_location);
  if (payload.work_location_other !== undefined) formData.append('work_location_other', payload.work_location_other);
  if (payload.floor !== undefined) formData.append('floor', payload.floor);
  if (payload.floor_other !== undefined) formData.append('floor_other', payload.floor_other);
  
  if (payload.aadhaar !== undefined) formData.append('aadhaar', payload.aadhaar);
  if (payload.pan !== undefined) formData.append('pan', payload.pan);
  if (payload.uan_number !== undefined) formData.append('uan_number', payload.uan_number);
  if (payload.esi_number !== undefined) formData.append('esi_number', payload.esi_number);
  
  if (payload.address !== undefined) formData.append('address', payload.address);
  if (payload.currently_staying_type !== undefined) formData.append('currently_staying_type', payload.currently_staying_type);
  if (payload.permanent_address !== undefined) formData.append('permanent_address', payload.permanent_address);
  if (payload.rental_address !== undefined) formData.append('rental_address', payload.rental_address);
  
  // Add file uploads if provided
  if (payload.passport_photo) formData.append('passport_photo', payload.passport_photo);
  if (payload.aadhaar_photo) formData.append('aadhaar_photo', payload.aadhaar_photo);
  if (payload.pan_photo) formData.append('pan_photo', payload.pan_photo);
  
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
      method: 'PUT',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update worker');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Update worker error:', error);
    throw error;
  }
}

/**
 * Delete worker
 */
export async function deleteWorker(workerId: number): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete worker');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Delete worker error:', error);
    throw error;
  }
}

/**
 * Get next employee number for contractor
 */
export async function getNextEmpNo(contractorId: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/next-emp-no/${contractorId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch next employee number');
    }
    
    const data = await response.json();
    return data.next_emp_no;
  } catch (error) {
    console.error('Get next emp no error:', error);
    throw error;
  }
}

