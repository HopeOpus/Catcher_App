import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-[#336699] to-[#0F2651] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Secure
          <span className="block">Your Valuables?</span>
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of people who have already discovered the peace of mind with Catcher. 
          Register your items today and stay protected.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        
            <img src="/playstore.png" alt="Play Store" className="h-13 w-47 " />
            
          
          
            <img src="/ios.png" alt="App Store" className="h-13 w-47 " />
            
         
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-8 justify-center items-center text-blue-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure & encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Instant setup</span>
          </div>
        </div>
      {/* <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full max-w-lg md:max-w-xl pointer-events-none">
        <img 
          src="/hand.png" 
          alt="Hand illustration" 
          className="w-full h-auto object-contain"
        />
      </div> */}
      </div>

    </section>
  );
}
