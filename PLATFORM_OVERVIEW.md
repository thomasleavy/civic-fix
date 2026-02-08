# CivicFix Platform Overview

## 🎯 Platform Purpose

CivicFix is a **community engagement platform** that enables residents to communicate with their local council about:

1. **Issues** - Problems that need fixing (potholes, broken lights, fallen wiring, etc.)
2. **Suggestions** - Ideas for improvements (better cycling infrastructure, new parks, community facilities, etc.)

**Note:** This platform is NOT for crime-related issues. It focuses on infrastructure, amenities, and community improvements.

---

## 📋 Two Types of Submissions

### 1. Issues (Problems to Fix)
**Examples:**
- Potholes
- Broken street lighting
- Fallen electrical wiring
- Litter problems
- Traffic sign issues
- Drainage problems

**Categories:**
- Pothole
- Lighting
- Litter
- Fallen Wiring
- Traffic Sign
- Drainage
- Other

### 2. Suggestions (Ideas for Improvement)
**Examples:**
- Better cycling infrastructure
- New parks or green spaces
- Improved public transport
- Pedestrian safety improvements
- Community facilities
- Environmental initiatives
- Accessibility improvements

**Categories:**
- Cycling Infrastructure
- Parks & Green Spaces
- Public Transport
- Pedestrian Safety
- Community Facilities
- Environmental
- Accessibility
- Other

---

## 🔄 User Flow

1. **User registers** → Creates account
2. **Completes profile** → Provides location, interests, etc.
3. **Views map** → Sees their local area
4. **Clicks on map** → Opens submission form
5. **Chooses type:**
   - **Issue** - Report a problem
   - **Suggestion** - Suggest an improvement
6. **Fills form** → Title, description, category, photos
7. **Submits** → Sent to council for review

---

## 🗄️ Database Structure

### Issues Table
- `type` - 'issue' or 'suggestion'
- `category` - Specific category
- `status` - reported → in_progress → resolved
- `location` - latitude, longitude
- `images` - Photo evidence
- `user_id` - Who submitted it

---

## 🎨 UI Features

### Home Page
- Shows both issues and suggestions
- Filter by type (issue/suggestion)
- Filter by category
- Filter by status

### Map View
- Click to submit
- Choose: Issue or Suggestion
- Different categories based on type
- Photo uploads

### Profile
- User's civic interests
- Location information
- Can update address and interests

---

## 📊 For Councils

The platform provides:
- **Citizen satisfaction data** - What areas matter most
- **Issue tracking** - Problems that need attention
- **Improvement ideas** - Suggestions from residents
- **Geographic data** - Where issues/suggestions are located
- **Priority insights** - Based on civic interests

---

## 🚫 What's NOT Included

- ❌ Crime reporting
- ❌ Emergency services
- ❌ Personal complaints
- ❌ Political issues

**Focus:** Infrastructure, amenities, and community improvements only.

---

## 🔧 Technical Implementation

### Backend
- `type` field in issues table
- Filtering by type
- Different categories for issues vs suggestions

### Frontend
- Radio buttons to select type
- Dynamic category lists
- Visual indicators (Issue vs Suggestion badges)
- Updated terminology throughout

---

**This platform bridges the gap between citizens and local government!** 🏛️
