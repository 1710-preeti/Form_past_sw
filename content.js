chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'AUTO_FILL') {
    const data = request.data;
    const filledCount = autoFillForm(data);
    sendResponse({ success: true, count: filledCount });
  }
  return true; 
});

function autoFillForm(data) {
  let count = 0;
  
  // Mapping of JSON keys to potential field names/labels
  const fieldMapping = {
    "first_name": ["first name", "firstname", "first_name", "f name"],
    "middle_name": ["middle name", "middlename", "middle_name", "m name"],
    "last_name": ["last name", "lastname", "last_name", "l name"],
    "dob": ["dob", "date of birth", "birth date", "birthday"],
    "gender": ["gender", "sex"],
    "nationality": ["nationality", "citizen"],
    "marital_status": ["marital status", "marriage status", "marital"],
    "passport": ["passport"],
    "hobbies": ["hobbies", "interests"],
    "languages_known": ["languages known", "language known", "languages", "language"],
    "address": ["address", "current address", "street"],
    "landmark": ["landmark"],
    "city": ["city"],
    "state": ["state"],
    "pincode": ["pincode", "zip code", "zip", "postal code"],
    "mobile": ["mobile", "phone", "contact number", "mobile number"],
    "email": ["email", "e-mail", "email address"],
    "ssc_result": ["ssc result", "10th result"],
    "ssc_board": ["ssc board", "10th board"],
    "ssc_year": ["ssc year", "ssc pass year", "10th year"],
    "hsc_result": ["hsc result", "12th result", "diploma result"],
    "hsc_board": ["hsc board", "12th board", "diploma board"],
    "hsc_year": ["hsc year", "hsc pass year", "12th year", "diploma year"],
    "graduation_degree": ["graduation degree"],
    "graduation_result": ["graduation result"],
    "graduation_university": ["graduation university", "graduation college"],
    "graduation_year": ["graduation year"],
    "post_graduation_degree": ["post graduation degree"],
    "post_graduation_result": ["post graduation result"],
    "post_graduation_university": ["post graduation university"],
    "post_graduation_year": ["post graduation year"],
    "higher_level_education": ["higher level education"],
    "total_work_experience": ["total work experience", "experience in years"],
    "total_work_experience_months": ["total work experience (in months)", "experience in months"],
    "no_of_companies": ["no of companies", "number of companies"],
    "last_employer": ["last employer", "current employer"],
    "objective": ["objective", "summary", "career objective"]
  };

  for (const [key, value] of Object.entries(data)) {
    let finalValue = value;
    if (finalValue === null || finalValue === undefined || (typeof finalValue === 'string' && finalValue.trim() === "")) {
      finalValue = "NA";
    }

    const aliases = fieldMapping[key] || [key];
    const field = findField(aliases);

    if (field) {
      setFieldValue(field, finalValue);
      count++;
    }
  }

  return count;
}

function findField(aliases) {
  // 1. Try ID or Name exact match
  for (const alias of aliases) {
    const formattedAlias = alias.replace(/\s+/g, '_').toLowerCase();
    const formattedAliasHyphen = alias.replace(/\s+/g, '-').toLowerCase();
    
    let el = document.getElementById(alias) || 
             document.getElementsByName(alias)[0] ||
             document.getElementById(formattedAlias) ||
             document.getElementsByName(formattedAlias)[0] ||
             document.getElementById(formattedAliasHyphen) ||
             document.getElementsByName(formattedAliasHyphen)[0];
    
    if (el) return el;
  }

  // 2. Try searching by Label text
  const labels = document.querySelectorAll('label');
  for (const label of labels) {
    const labelText = label.textContent.toLowerCase().trim();
    for (const alias of aliases) {
      if (labelText.includes(alias.toLowerCase())) {
        const fieldId = label.getAttribute('for');
        if (fieldId) {
          const el = document.getElementById(fieldId);
          if (el) return el;
        }
        // If no 'for' attribute, look for input inside or next to label
        const nestedInput = label.querySelector('input, textarea, select');
        if (nestedInput) return nestedInput;
        
        // Try next sibling
        const siblingInput = label.nextElementSibling;
        if (siblingInput && (siblingInput.tagName === 'INPUT' || siblingInput.tagName === 'TEXTAREA' || siblingInput.tagName === 'SELECT')) {
          return siblingInput;
        }
      }
    }
  }

  // 3. Try searching by Placeholder text
  const inputs = document.querySelectorAll('input, textarea, select');
  for (const input of inputs) {
    const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
    for (const alias of aliases) {
      if (placeholder.includes(alias.toLowerCase())) {
        return input;
      }
    }
  }

  return null;
}

function setFieldValue(field, value) {
  // Special handling for email addresses provided by ChatGPT (sometimes include markdown)
  let cleanValue = value;
  if (typeof value === 'string' && value.includes('mailto:')) {
    const match = value.match(/\[(.*?)\]/);
    if (match) cleanValue = match[1];
    else cleanValue = value.replace(/\[|\]|\(mailto:.*?\)/g, '');
  }

  if (field.tagName === 'SELECT') {
    // Try to find matching option
    const options = Array.from(field.options);
    const targetOption = options.find(opt => 
      opt.value.toLowerCase() === cleanValue.toLowerCase() || 
      opt.text.toLowerCase() === cleanValue.toLowerCase()
    );
    if (targetOption) {
      field.value = targetOption.value;
    }
  } else if (field.type === 'checkbox' || field.type === 'radio') {
    // Simple boolean check for checkboxes or radio match for text
    if (typeof cleanValue === 'boolean') {
      field.checked = cleanValue;
    } else if (field.value.toLowerCase() === cleanValue.toLowerCase()) {
      field.checked = true;
    }
  } else {
    field.value = cleanValue;
  }

  // Trigger events for framework compatibility
  const events = ['input', 'change', 'blur'];
  events.forEach(eventName => {
    field.dispatchEvent(new Event(eventName, { bubbles: true }));
  });
}
