import React from "react";

const Footer: React.FC = () => {
  return (
    <footer
      className="border-t shadow-md mt-6"
      style={{
        background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
      }}
    >
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center text-sm text-gray-700">
        {/* Left Side */}
        <p className="mb-2 md:mb-0">
          © {new Date().getFullYear()} Management System. All rights reserved.
        </p>

        {/* Right Side Links */}
        <div className="flex space-x-4">
          <a
            href="/privacy"
            className="hover:text-[#001F7A] transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="hover:text-[#001F7A] transition-colors"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
