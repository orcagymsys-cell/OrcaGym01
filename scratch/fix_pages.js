const fs = require('fs');

// --- 1. Modify app/add-child/page.tsx ---
let addCode = fs.readFileSync('app/add-child/page.tsx', 'utf8');

// Add selectedFile state
if (!addCode.includes('selectedFile, setSelectedFile')) {
  addCode = addCode.replace(
    'const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);',
    `const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);\n    const [selectedFile, setSelectedFile] = useState<File | null>(null);`
  );
}

// Update handleFileChange
const oldFileChange = `const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoDataUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`;
const newFileChange = `const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoDataUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`;
addCode = addCode.replace(oldFileChange, newFileChange);

// Update saveChild logic
if (!addCode.includes('await store.uploadAvatar')) {
  addCode = addCode.replace(
    /const newChild: Child = \{\s*id: childId,[\s\S]*?expiry_date: '02\/02\/2070'\s*\};/,
    `let finalPhotoUrl = photoDataUrl || undefined;
    if (selectedFile) {
      showToast('กำลังอัปโหลดรูปภาพ...');
      const uploaded = await store.uploadAvatar(selectedFile, user.user_id || user.id);
      if (uploaded) {
        finalPhotoUrl = uploaded;
      }
    }

    const newChild: Child = {
      id: childId,
      parent_id: user.id,
      full_name: fName,
      nickname: nName,
      dob: validDob,
      gender,
      avatar: gender.toLowerCase() === 'boy' ? 'boy' : 'girl',
      photo_url: finalPhotoUrl,
      status: 'approved',
      course_name: 'Orca Cubs',
      total_hours: hoursToSet,
      used_hours: 0,
      expiry_date: '02/02/2070'
    };`
  );
  // Clear selectedFile on success
  addCode = addCode.replace(
    /setPhotoDataUrl\(null\);/g,
    'setPhotoDataUrl(null);\n      setSelectedFile(null);'
  );
}
fs.writeFileSync('app/add-child/page.tsx', addCode, 'utf8');

// --- 2. Modify app/student/[id]/edit/page.tsx ---
let editCode = fs.readFileSync('app/student/[id]/edit/page.tsx', 'utf8');

if (!editCode.includes('selectedFile, setSelectedFile')) {
  editCode = editCode.replace(
    'const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);',
    `const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);\n    const [selectedFile, setSelectedFile] = useState<File | null>(null);`
  );
}

const oldEditFileChange = `const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoDataUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`;
const newEditFileChange = `const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoDataUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`;
editCode = editCode.replace(oldEditFileChange, newEditFileChange);

if (!editCode.includes('await store.uploadAvatar')) {
  editCode = editCode.replace(
    /const updates: Partial<Child> = \{\s*full_name: fName,[\s\S]*?photo_url: photoDataUrl \|\| undefined\s*\};/,
    `let finalPhotoUrl = photoDataUrl || undefined;
    if (selectedFile) {
      showToast('กำลังอัปโหลดรูปภาพ...');
      const uploaded = await store.uploadAvatar(selectedFile, child.id);
      if (uploaded) {
        finalPhotoUrl = uploaded;
      }
    }

    const updates: Partial<Child> = {
      full_name: fName,
      nickname: nName,
      dob: validDob,
      gender,
      photo_url: finalPhotoUrl
    };`
  );
}
fs.writeFileSync('app/student/[id]/edit/page.tsx', editCode, 'utf8');

console.log('Fixed add-child and edit pages');
