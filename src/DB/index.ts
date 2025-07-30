import { AboutModel } from "../modules/settings/About/About.model";
import { PrivacyModel } from "../modules/settings/privacy/Privacy.model";
import { TermsModel } from "../modules/settings/Terms/Terms.model";
import { UserModel } from "../modules/user/user.model";
import { hashPassword } from "../modules/user/user.utils";

const admin = {
  name: "Anthony",
  username: "anthony23",
  email: "heirloomai.app@gmail.com",
  password: "1qazxsw2",
  role: "admin",
  isDeleted: false,
};
const admin2 = {
  name: "Admin",
  username: "admin34",
  email: "admin@gmail.com",
  password: "1qazxsw2",
  role: "admin",
  isDeleted: false,
};

const dummyPrivacy = {
  description: "dummy privacy and policy",
};
const dummyAbout = {
  description: "dummy about us ",
};
const dummyTerms = {
  description: "dummy terms and conditions",
};
// export const seedSuperAdmin = async () => {
//   // Seed MD Admin
//   await seedAdmin(admin);
// };
// const seedAdmin = async (adminData: any) => {
//   const isExists = await UserModel.findOne({ email: adminData.email });

//   if (!isExists) {
//     const hashedPassword = await hashPassword(adminData.password);
//     const adminWithHashedPassword = { ...adminData, password: hashedPassword };

//     await UserModel.create(adminWithHashedPassword);
//   }
// };

export const seedSuperAdmin = async () => {
  const admins = [admin, admin2];

  for (const adminData of admins) {
    const isAdminExists = await UserModel.findOne({ email: adminData.email });

    if (!isAdminExists) {
      const hashedPassword = await hashPassword(adminData.password);
      const adminWithHashedPassword = {
        ...adminData,
        password: hashedPassword,
      };

      await UserModel.create(adminWithHashedPassword);
      console.log(`Admin created: ${adminData.email}`);
    } else {
      console.log(`Admin already exists: ${adminData.email}`);
    }
  }
};

export const seedPrivacy = async () => {
  const privacy = await PrivacyModel.findOne();
  if (!privacy) {
    await PrivacyModel.create(dummyPrivacy);
    // console.log("Banner News created");
  }
};
export const seedTerms = async () => {
  const terms = await TermsModel.findOne();
  if (!terms) {
    await TermsModel.create(dummyTerms);
    // console.log("Banner News created");
  }
};
export const seedAbout = async () => {
  const about = await AboutModel.findOne();
  if (!about) {
    await AboutModel.create(dummyAbout);
    // console.log("Banner News created");
  }
};
export default seedSuperAdmin;
