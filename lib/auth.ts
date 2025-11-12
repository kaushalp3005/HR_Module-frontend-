// Authentication utility functions
import bcrypt from "bcryptjs"

export interface AuthUser {
  email: string
  name: string
  role: "hr" | "contractor"
  contractorId?: string
  contractorName?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

const HR_CREDENTIALS = {
  email: "ashwin@candorfoods.in",
  name: "Ashwin",
  passwordHash: "$2b$10$lKPjt.hkNCmO/rEYgzbJbOii84/gG5Rzei/0OUUoxsZKFfE1LboWm", // ashwinbagul
}

const CONTRACTOR_CREDENTIALS = [
  {
    id: "c1",
    email: "alsakhienterprises27@gmail.com",
    name: "MuFi",
    passwordHash: "$2b$10$ceTLq9K7wRIOKDQ37HAwNeTeIf9pmTEq1bnAGs7Xw0xU1YfzweoZm", // muf2025
    companyName: "MuFi Enterprises",
  },
  {
    id: "c2",
    email: "alsakhienterprises27@gmail.com", 
    name: "SAMIR",
    passwordHash: "$2b$10$YZdvqfGX8q7HNNZ4/hqND..jUu6m4ijM4R7JvnerekAzaR1L93TKe", // samir2025
    companyName: "Samir Enterprises",
  },
]

export function authenticateUser(credentials: LoginCredentials): AuthUser | null {
  const { email, password } = credentials

  console.log('=== Auto Authentication Debug ===')
  console.log('Input email:', email)
  console.log('Input password length:', password.length)

  // First, try HR authentication
  console.log('Checking HR credentials...')
  if (email.toLowerCase() === HR_CREDENTIALS.email.toLowerCase()) {
    console.log('HR email match found')
    const passwordMatch = bcrypt.compareSync(password, HR_CREDENTIALS.passwordHash)
    console.log('HR password match:', passwordMatch)
    
    if (passwordMatch) {
      console.log('HR authentication successful')
      return {
        email: HR_CREDENTIALS.email,
        name: HR_CREDENTIALS.name,
        role: "hr",
      }
    }
  }

  // Then, try contractor authentication
  console.log('Checking contractor credentials...')
  const matchingContractors = CONTRACTOR_CREDENTIALS.filter(
    (c) => email.toLowerCase() === c.email.toLowerCase()
  )

  if (matchingContractors.length > 0) {
    console.log('Found', matchingContractors.length, 'contractors with matching email')
    
    // Try each contractor with the same email until we find a password match
    for (const contractor of matchingContractors) {
      console.log('Testing contractor:', contractor.name)
      const passwordMatch = bcrypt.compareSync(password, contractor.passwordHash)
      console.log('Password match for', contractor.name + ':', passwordMatch)
      
      if (passwordMatch) {
        console.log('Contractor authentication successful for:', contractor.name)
        return {
          email: contractor.email,
          name: contractor.name,
          role: "contractor",
          contractorId: contractor.id,
          contractorName: contractor.companyName,
        }
      }
    }
    console.log('No password match found for any contractor with this email')
  }

  console.log('Authentication failed - no matching credentials')
  return null
}

export function getContractorOptions() {
  return CONTRACTOR_CREDENTIALS.map((c) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
  }))
}
