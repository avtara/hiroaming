import { Metadata } from "next"
import { DeviceCompatibilityContent } from "./device-compatibility-content"

// Local type definition for compatible devices (no database table exists yet)
interface CompatibleDevice {
  id: string
  brand: string
  model: string
  is_compatible: boolean
}

export const metadata: Metadata = {
  title: "Kompatibilitas Perangkat",
  description: "Cek apakah perangkat Anda mendukung eSIM.",
}

// Static list of compatible devices (can be moved to database later)
function getCompatibleDevices(): CompatibleDevice[] {
  // Return a static list of popular eSIM-compatible devices
  return [
    { id: "1", brand: "Apple", model: "iPhone XS", is_compatible: true },
    { id: "2", brand: "Apple", model: "iPhone XS Max", is_compatible: true },
    { id: "3", brand: "Apple", model: "iPhone XR", is_compatible: true },
    { id: "4", brand: "Apple", model: "iPhone 11", is_compatible: true },
    { id: "5", brand: "Apple", model: "iPhone 11 Pro", is_compatible: true },
    { id: "6", brand: "Apple", model: "iPhone 11 Pro Max", is_compatible: true },
    { id: "7", brand: "Apple", model: "iPhone SE (2020)", is_compatible: true },
    { id: "8", brand: "Apple", model: "iPhone 12", is_compatible: true },
    { id: "9", brand: "Apple", model: "iPhone 12 mini", is_compatible: true },
    { id: "10", brand: "Apple", model: "iPhone 12 Pro", is_compatible: true },
    { id: "11", brand: "Apple", model: "iPhone 12 Pro Max", is_compatible: true },
    { id: "12", brand: "Apple", model: "iPhone 13", is_compatible: true },
    { id: "13", brand: "Apple", model: "iPhone 13 mini", is_compatible: true },
    { id: "14", brand: "Apple", model: "iPhone 13 Pro", is_compatible: true },
    { id: "15", brand: "Apple", model: "iPhone 13 Pro Max", is_compatible: true },
    { id: "16", brand: "Apple", model: "iPhone 14", is_compatible: true },
    { id: "17", brand: "Apple", model: "iPhone 14 Plus", is_compatible: true },
    { id: "18", brand: "Apple", model: "iPhone 14 Pro", is_compatible: true },
    { id: "19", brand: "Apple", model: "iPhone 14 Pro Max", is_compatible: true },
    { id: "20", brand: "Apple", model: "iPhone 15", is_compatible: true },
    { id: "21", brand: "Apple", model: "iPhone 15 Plus", is_compatible: true },
    { id: "22", brand: "Apple", model: "iPhone 15 Pro", is_compatible: true },
    { id: "23", brand: "Apple", model: "iPhone 15 Pro Max", is_compatible: true },
    { id: "24", brand: "Samsung", model: "Galaxy S20", is_compatible: true },
    { id: "25", brand: "Samsung", model: "Galaxy S20+", is_compatible: true },
    { id: "26", brand: "Samsung", model: "Galaxy S20 Ultra", is_compatible: true },
    { id: "27", brand: "Samsung", model: "Galaxy S21", is_compatible: true },
    { id: "28", brand: "Samsung", model: "Galaxy S21+", is_compatible: true },
    { id: "29", brand: "Samsung", model: "Galaxy S21 Ultra", is_compatible: true },
    { id: "30", brand: "Samsung", model: "Galaxy S22", is_compatible: true },
    { id: "31", brand: "Samsung", model: "Galaxy S22+", is_compatible: true },
    { id: "32", brand: "Samsung", model: "Galaxy S22 Ultra", is_compatible: true },
    { id: "33", brand: "Samsung", model: "Galaxy S23", is_compatible: true },
    { id: "34", brand: "Samsung", model: "Galaxy S23+", is_compatible: true },
    { id: "35", brand: "Samsung", model: "Galaxy S23 Ultra", is_compatible: true },
    { id: "36", brand: "Samsung", model: "Galaxy Z Flip", is_compatible: true },
    { id: "37", brand: "Samsung", model: "Galaxy Z Flip 3", is_compatible: true },
    { id: "38", brand: "Samsung", model: "Galaxy Z Flip 4", is_compatible: true },
    { id: "39", brand: "Samsung", model: "Galaxy Z Flip 5", is_compatible: true },
    { id: "40", brand: "Samsung", model: "Galaxy Z Fold 2", is_compatible: true },
    { id: "41", brand: "Samsung", model: "Galaxy Z Fold 3", is_compatible: true },
    { id: "42", brand: "Samsung", model: "Galaxy Z Fold 4", is_compatible: true },
    { id: "43", brand: "Samsung", model: "Galaxy Z Fold 5", is_compatible: true },
    { id: "44", brand: "Google", model: "Pixel 3", is_compatible: true },
    { id: "45", brand: "Google", model: "Pixel 3 XL", is_compatible: true },
    { id: "46", brand: "Google", model: "Pixel 4", is_compatible: true },
    { id: "47", brand: "Google", model: "Pixel 4 XL", is_compatible: true },
    { id: "48", brand: "Google", model: "Pixel 4a", is_compatible: true },
    { id: "49", brand: "Google", model: "Pixel 5", is_compatible: true },
    { id: "50", brand: "Google", model: "Pixel 5a", is_compatible: true },
    { id: "51", brand: "Google", model: "Pixel 6", is_compatible: true },
    { id: "52", brand: "Google", model: "Pixel 6 Pro", is_compatible: true },
    { id: "53", brand: "Google", model: "Pixel 6a", is_compatible: true },
    { id: "54", brand: "Google", model: "Pixel 7", is_compatible: true },
    { id: "55", brand: "Google", model: "Pixel 7 Pro", is_compatible: true },
    { id: "56", brand: "Google", model: "Pixel 7a", is_compatible: true },
    { id: "57", brand: "Google", model: "Pixel 8", is_compatible: true },
    { id: "58", brand: "Google", model: "Pixel 8 Pro", is_compatible: true },
    { id: "59", brand: "Xiaomi", model: "12T Pro", is_compatible: true },
    { id: "60", brand: "Xiaomi", model: "13", is_compatible: true },
    { id: "61", brand: "Xiaomi", model: "13 Pro", is_compatible: true },
    { id: "62", brand: "Huawei", model: "P40", is_compatible: true },
    { id: "63", brand: "Huawei", model: "P40 Pro", is_compatible: true },
    { id: "64", brand: "Huawei", model: "Mate 40 Pro", is_compatible: true },
    { id: "65", brand: "Oppo", model: "Find X3 Pro", is_compatible: true },
    { id: "66", brand: "Oppo", model: "Find X5", is_compatible: true },
    { id: "67", brand: "Oppo", model: "Find X5 Pro", is_compatible: true },
  ]
}

export default function DeviceCompatibilityPage() {
  const devices = getCompatibleDevices()

  // Group devices by brand
  const devicesByBrand = devices.reduce((acc, device) => {
    if (!acc[device.brand]) {
      acc[device.brand] = []
    }
    acc[device.brand].push(device)
    return acc
  }, {} as Record<string, typeof devices>)

  return <DeviceCompatibilityContent devicesByBrand={devicesByBrand} />
}
